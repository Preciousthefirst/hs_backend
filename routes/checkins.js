const express = require('express');
const router = express.Router();
const { Checkin, Business, User } = require('../db.js');
const authenticateJWT = require('../middleware/authenticateJWT');
const { awardPoints, checkMilestones } = require('../utils/gamification');
const { isWithinRadius, formatDistance, calculateDistance } = require('../utils/geocoding');

// ============================================================================
// 📍 POST /checkins — Check in to a business (with GPS verification)
// ============================================================================
router.post('/', authenticateJWT, async (req, res) => {
    const user_id = req.user.id;
    const { business_id, user_latitude, user_longitude } = req.body;

    if (!business_id) {
        return res.status(400).json({ error: 'business_id is required' });
    }

    try {
        // Step 1: Check if business exists and get its GPS coordinates
        const business = await Business.findById(business_id);

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const businessName = business.name;
        const businessLat = business.latitude;
        const businessLon = business.longitude;

        // 🗺️ Step 1a: Verify GPS location (if coordinates provided)
        let locationVerified = false;
        let distanceFromBusiness = null;

        if (user_latitude && user_longitude) {
            if (businessLat && businessLon) {
                // Calculate distance
                distanceFromBusiness = calculateDistance(
                    user_latitude, 
                    user_longitude, 
                    businessLat, 
                    businessLon
                );

                // Check if within 500m radius
                locationVerified = isWithinRadius(
                    user_latitude, 
                    user_longitude, 
                    businessLat, 
                    businessLon, 
                    500
                );

                if (!locationVerified) {
                    return res.status(403).json({ 
                        error: 'You are too far from this business to check in',
                        distance: formatDistance(distanceFromBusiness),
                        required: '500m',
                        message: `You are ${formatDistance(distanceFromBusiness)} away. Please get within 500m to check in.`
                    });
                }
            } else {
                // Business doesn't have GPS coordinates - allow with warning
                console.log(`⚠️ Business "${businessName}" has no GPS coordinates - allowing check-in without verification`);
                locationVerified = true; // Allow anyway
            }
        } else {
            // User didn't provide GPS coordinates - allow with warning
            console.log(`⚠️ User ${user_id} checked in without GPS verification`);
            locationVerified = true; // Allow anyway (default behavior)
        }

        // Step 2: Check for existing check-in within 24 hours
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const recentCheckin = await Checkin.findOne({
            user_id,
            business_id,
            createdAt: { $gte: twentyFourHoursAgo }
        }).sort({ createdAt: -1 });

        // Guard: 1 check-in per business per 24 hours
        if (recentCheckin) {
            const hoursSinceLastCheckin = (new Date() - recentCheckin.createdAt) / (1000 * 60 * 60);
            const hoursRemaining = Math.ceil(24 - hoursSinceLastCheckin);
            
            return res.status(429).json({ 
                error: 'You can only check in once per 24 hours',
                hoursRemaining,
                lastCheckin: recentCheckin.createdAt.toISOString()
            });
        }

        // Step 3: Create new check-in
        const checkin = new Checkin({
            user_id,
            business_id
        });

        const savedCheckin = await checkin.save();

        // Step 4: Award +10 points
        awardPoints(user_id, 10, async (err4, pointsAwarded) => {
            if (err4) {
                console.error('Points award error:', err4);
            }

            // Step 5: Check for milestone achievements
            checkMilestones(user_id, (err5, newAchievements) => {
                if (err5) {
                    console.error('Milestone check error:', err5);
                }

                res.status(201).json({
                    message: 'Check-in successful!',
                    checkin_id: savedCheckin._id.toString(),
                    business_name: businessName,
                    points_awarded: pointsAwarded,
                    new_achievements: newAchievements || [],
                    location_verified: locationVerified && distanceFromBusiness !== null,
                    distance: distanceFromBusiness ? formatDistance(distanceFromBusiness) : null
                });
            });
        });
    } catch (err) {
        console.error('Check-in error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ============================================================================
// 📍 GET /checkins/user/:userId — Get all check-ins for a user
// ============================================================================
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const checkins = await Checkin.find({ user_id: userId })
            .populate('business_id', 'name category address')
            .sort({ createdAt: -1 })
            .lean();

        const formattedCheckins = checkins.map(c => ({
            id: c._id.toString(),
            created_at: c.createdAt,
            business_id: c.business_id._id.toString(),
            business_name: c.business_id.name,
            category: c.business_id.category,
            address: c.business_id.address
        }));

        res.json(formattedCheckins);
    } catch (err) {
        console.error('Check-ins fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch check-ins' });
    }
});

// ============================================================================
// 📍 GET /checkins/business/:businessId — Get all check-ins for a business
// ============================================================================
router.get('/business/:businessId', async (req, res) => {
    const { businessId } = req.params;

    try {
        const checkins = await Checkin.find({ business_id: businessId })
            .populate('user_id', 'name points level')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const formattedCheckins = checkins.map(c => ({
            id: c._id.toString(),
            created_at: c.createdAt,
            user_id: c.user_id._id.toString(),
            username: c.user_id.name,
            points: c.user_id.points,
            level: c.user_id.level
        }));

        res.json(formattedCheckins);
    } catch (err) {
        console.error('Business check-ins fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch check-ins' });
    }
});

// ============================================================================
// 📍 GET /checkins/stats/:userId — Get check-in stats for a user
// ============================================================================
router.get('/stats/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const checkins = await Checkin.find({ user_id: userId }).lean();

        const total_checkins = checkins.length;
        const unique_businesses = new Set(checkins.map(c => c.business_id.toString())).size;
        const lastCheckin = checkins.length > 0 
            ? checkins.reduce((latest, c) => {
                const cDate = new Date(c.createdAt);
                const latestDate = new Date(latest.createdAt);
                return cDate > latestDate ? c : latest;
            }, checkins[0]).createdAt
            : null;

        res.json({
            total_checkins,
            unique_businesses,
            last_checkin: lastCheckin
        });
    } catch (err) {
        console.error('Check-in stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
