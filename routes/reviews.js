const express = require('express');
const router = express.Router();
const { Review, User, Business, Media, ReviewLike, ReviewReport, Subscription } = require('../db.js');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { awardPoints, deductPoints, checkMilestones } = require('../utils/gamification');
const { getCoordinatesFromAddress } = require('../utils/geocoding');

// Get top-rated reviews globally
router.get('/top', async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    try {
        const reviews = await Review.find()
            .populate('user_id', 'name')
            .sort({ rating: -1, createdAt: -1 })
            .limit(limit)
            .lean();

        const formattedReviews = reviews.map(r => ({
            ...r,
            id: r._id.toString(),
            user_id: r.user_id._id.toString(),
            username: r.user_id.name,
            created_at: r.createdAt
        }));

        res.json(formattedReviews);
    } catch (err) {
        console.error('Error fetching top reviews:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Get reported reviews (for admin/moderation)
router.get('/reported/all', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    try {
        const reports = await ReviewReport.find()
            .populate('review_id', 'text')
            .populate('user_id', 'name')
            .lean();

        // Group reports by review
        const reportsByReview = {};
        reports.forEach(report => {
            const reviewId = report.review_id._id.toString();
            if (!reportsByReview[reviewId]) {
                reportsByReview[reviewId] = {
                    review_id: reviewId,
                    review_content: report.review_id.text,
                    report_count: 0,
                    report_reasons: [],
                    reporting_users: []
                };
            }
            reportsByReview[reviewId].report_count++;
            reportsByReview[reviewId].report_reasons.push(report.reason);
            reportsByReview[reviewId].reporting_users.push(report.user_id.name);
        });

        const results = Object.values(reportsByReview).map(r => ({
            ...r,
            report_reasons: r.report_reasons.join('; '),
            reporting_users: r.reporting_users.join('; ')
        })).sort((a, b) => b.report_count - a.report_count);

        res.json(results);
    } catch (err) {
        console.error('Error fetching reported reviews:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// GET all reviews with business + media info (returns media as array)
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user_id', 'name points')
            .populate('business_id', 'name division category address')
            .sort({ createdAt: -1 })
            .lean();

        // Get all media for all businesses
        const businessIds = [...new Set(reviews.map(r => r.business_id._id.toString()))];
        const allMedia = await Media.find({ business_id: { $in: businessIds } }).lean();

        // Get likes count for all reviews
        const reviewIds = reviews.map(r => r._id);
        const likesCounts = await ReviewLike.aggregate([
            { $match: { review_id: { $in: reviewIds }, is_like: true } },
            { $group: { _id: '$review_id', count: { $sum: 1 } } }
        ]);

        const likesMap = {};
        likesCounts.forEach(item => {
            likesMap[item._id.toString()] = item.count;
        });

        // Group media by business_id
        const mediaByBusiness = {};
        allMedia.forEach(m => {
            const businessId = m.business_id.toString();
            if (!mediaByBusiness[businessId]) {
                mediaByBusiness[businessId] = [];
            }
            mediaByBusiness[businessId].push({
                id: m._id.toString(),
                url: m.media_url,
                type: m.media_type
            });
        });

        const formattedReviews = reviews.map(r => ({
            id: r._id.toString(),
            user_id: r.user_id._id.toString(),
            username: r.user_id.name,
            points: r.user_id.points,
            rating: r.rating,
            text: r.text,
            tags: r.tags || [],
            created_at: r.createdAt,
            updated_at: r.updatedAt,
            business: {
                name: r.business_id.name,
                division: r.business_id.division,
                category: r.business_id.category,
                address: r.business_id.address
            },
            media: mediaByBusiness[r.business_id._id.toString()] || [],
            likes: likesMap[r._id.toString()] || 0,
            dislikes: 0
        }));

        res.json(formattedReviews);
    } catch (err) {
        console.error('Error fetching all reviews:', err);
        res.status(500).json({ error: 'Error fetching all reviews' });
    }
});

// ============================================================================
// 🔍 GET /reviews/search?q=keyword — Search reviews by tags (PUBLIC - no auth required)
// ============================================================================
router.get('/search', async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.json({
            query: q || '',
            results_count: 0,
            reviews: []
        });
    }

    // Split search query into individual words
    const searchTerms = q.trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(term => term.length > 0);

    if (searchTerms.length === 0) {
        return res.json({
            query: q,
            results_count: 0,
            reviews: []
        });
    }

    try {
        // Search for reviews where tags array contains any of the search terms (case-insensitive)
        // Build query to match any tag that contains any search term
        const tagQueries = searchTerms.map(term => ({
            tags: { $regex: term, $options: 'i' }
        }));
        
        const reviews = await Review.find({
            $or: tagQueries
        })
            .populate('user_id', 'name points')
            .populate('business_id', 'name division category address description')
            .sort({ createdAt: -1 })
            .lean();

        // Get media and likes
        const businessIds = [...new Set(reviews.map(r => r.business_id._id.toString()))];
        const reviewIds = reviews.map(r => r._id);
        
        const [allMedia, likesCounts] = await Promise.all([
            Media.find({ business_id: { $in: businessIds } }).lean(),
            ReviewLike.aggregate([
                { $match: { review_id: { $in: reviewIds }, is_like: true } },
                { $group: { _id: '$review_id', count: { $sum: 1 } } }
            ])
        ]);

        const likesMap = {};
        likesCounts.forEach(item => {
            likesMap[item._id.toString()] = item.count;
        });

        const mediaByBusiness = {};
        allMedia.forEach(m => {
            const businessId = m.business_id.toString();
            if (!mediaByBusiness[businessId]) {
                mediaByBusiness[businessId] = [];
            }
            mediaByBusiness[businessId].push({
                id: m._id.toString(),
                url: m.media_url,
                type: m.media_type
            });
        });

        const formattedReviews = reviews.map(r => ({
            id: r._id.toString(),
            user_id: r.user_id._id.toString(),
            username: r.user_id.name,
            points: r.user_id.points,
            rating: r.rating,
            text: r.text,
            tags: r.tags || [],
            created_at: r.createdAt,
            updated_at: r.updatedAt,
            business: {
                id: r.business_id._id.toString(),
                name: r.business_id.name,
                division: r.business_id.division,
                category: r.business_id.category,
                address: r.business_id.address,
                description: r.business_id.description
            },
            media: mediaByBusiness[r.business_id._id.toString()] || [],
            likes: likesMap[r._id.toString()] || 0,
            dislikes: 0
        }));

        res.json({
            query: q,
            results_count: formattedReviews.length,
            reviews: formattedReviews
        });
    } catch (err) {
        console.error('Error searching reviews by tags:', err);
        res.status(500).json({ error: 'Error searching reviews' });
    }
});

// Get all reviews with business info (global)
router.get('/all', async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user_id', 'name points')
            .populate('business_id', 'name division category address')
            .sort({ createdAt: -1 })
            .lean();

        const reviewIds = reviews.map(r => r._id);
        const likesCounts = await ReviewLike.aggregate([
            { $match: { review_id: { $in: reviewIds }, is_like: true } },
            { $group: { _id: '$review_id', count: { $sum: 1 } } }
        ]);

        const likesMap = {};
        likesCounts.forEach(item => {
            likesMap[item._id.toString()] = item.count;
        });

        const formattedReviews = reviews.map(r => ({
            id: r._id.toString(),
            user_id: r.user_id._id.toString(),
            rating: r.rating,
            text: r.text,
            created_at: r.createdAt,
            updated_at: r.updatedAt,
            business_name: r.business_id.name,
            division: r.business_id.division,
            category: r.business_id.category,
            address: r.business_id.address,
            username: r.user_id.name,
            points: r.user_id.points,
            likes: likesMap[r._id.toString()] || 0,
            dislikes: 0
        }));

        res.json(formattedReviews);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Error fetching reviews' });
    }
});

// GET reviews by business ID
router.get('/business/:businessId', async (req, res) => {
    const { businessId } = req.params;

    try {
        const reviews = await Review.find({ business_id: businessId })
            .populate('user_id', 'name points')
            .populate('business_id', 'name division category address')
            .sort({ createdAt: -1 })
            .lean();

        const reviewIds = reviews.map(r => r._id);
        const likesCounts = await ReviewLike.aggregate([
            { $match: { review_id: { $in: reviewIds }, is_like: true } },
            { $group: { _id: '$review_id', count: { $sum: 1 } } }
        ]);

        const likesMap = {};
        likesCounts.forEach(item => {
            likesMap[item._id.toString()] = item.count;
        });

        const formattedReviews = reviews.map(r => ({
            id: r._id.toString(),
            user_id: r.user_id._id.toString(),
            rating: r.rating,
            text: r.text,
            created_at: r.createdAt,
            updated_at: r.updatedAt,
            business_name: r.business_id.name,
            division: r.business_id.division,
            category: r.business_id.category,
            address: r.business_id.address,
            username: r.user_id.name,
            points: r.user_id.points,
            likes: likesMap[r._id.toString()] || 0,
            dislikes: 0
        }));

        res.json(formattedReviews);
    } catch (err) {
        console.error('Error fetching business reviews:', err);
        res.status(500).json({ error: 'Error fetching business reviews' });
    }
});

// GET all reviews for a specific business (with media inline)
router.get('/business/name/:businessName', async (req, res) => {
    const { businessName } = req.params;

    try {
        const business = await Business.findOne({ name: businessName });
        
        if (!business) {
            return res.status(404).json({ message: 'No reviews found for this business' });
        }

        const reviews = await Review.find({ business_id: business._id })
            .populate('user_id', 'name points')
            .populate('business_id', 'name division category address')
            .sort({ createdAt: -1 })
            .lean();

        const allMedia = await Media.find({ business_id: business._id }).lean();
        const reviewIds = reviews.map(r => r._id);
        
        const likesCounts = await ReviewLike.aggregate([
            { $match: { review_id: { $in: reviewIds }, is_like: true } },
            { $group: { _id: '$review_id', count: { $sum: 1 } } }
        ]);

        const likesMap = {};
        likesCounts.forEach(item => {
            likesMap[item._id.toString()] = item.count;
        });

        const mediaList = allMedia.map(m => ({
            id: m._id.toString(),
            url: m.media_url,
            type: m.media_type
        }));

        const formattedReviews = reviews.map(r => ({
            id: r._id.toString(),
            user_id: r.user_id._id.toString(),
            username: r.user_id.name,
            points: r.user_id.points,
            rating: r.rating,
            text: r.text,
            created_at: r.createdAt,
            updated_at: r.updatedAt,
            business: {
                name: r.business_id.name,
                division: r.business_id.division,
                category: r.business_id.category,
                address: r.business_id.address
            },
            media: mediaList,
            likes: likesMap[r._id.toString()] || 0,
            dislikes: 0
        }));

        res.json(formattedReviews);
    } catch (err) {
        console.error('Error fetching reviews for business:', err);
        res.status(500).json({ error: 'Error fetching reviews for this business' });
    }
});

// GET a single review by ID (with media inline)
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const review = await Review.findById(id)
            .populate('user_id', 'name points')
            .populate('business_id', 'name division category address')
            .lean();

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const [media, likesCount] = await Promise.all([
            Media.find({ business_id: review.business_id._id }).lean(),
            ReviewLike.countDocuments({ review_id: id, is_like: true })
        ]);

        const reviewObj = {
            id: review._id.toString(),
            user_id: review.user_id._id.toString(),
            username: review.user_id.name,
            points: review.user_id.points,
            rating: review.rating,
            text: review.text,
            created_at: review.createdAt,
            updated_at: review.updatedAt,
            business: {
                name: review.business_id.name,
                division: review.business_id.division,
                category: review.business_id.category,
                address: review.business_id.address
            },
            media: media.map(m => ({
                id: m._id.toString(),
                url: m.media_url,
                type: m.media_type
            })),
            likes: likesCount,
            dislikes: 0
        };

        res.json(reviewObj);
    } catch (err) {
        console.error('Error fetching review:', err);
        res.status(500).json({ error: 'Error fetching review' });
    }
});

// POST a new review with subscription, business, media, points logic
router.post('/', authenticateJWT, upload.array('media', 4), async (req, res) => {
    const user_id = req.user.id;
    const {
        business_name,
        division,
        category,
        address,
        text,
        rating,
        tags,
        description,
        location,
        contact,
        latitude,
        longitude,
        place_id
    } = req.body;
    const mediaFiles = Array.isArray(req.files) ? req.files : [];

    console.log('📝 Review submission received:');
    console.log('  - business_name:', business_name);
    console.log('  - user_id:', user_id);
    console.log('  - address:', address);

    if (!user_id) {
        console.error('❌ Validation failed: user_id missing (not logged in?)');
        return res.status(401).json({ error: 'You must be logged in to submit a review' });
    }

    if (!business_name) {
        console.error('❌ Validation failed: business_name missing');
        return res.status(400).json({ error: 'Business name is required' });
    }

    try {
        // STEP 1: Check subscription uploads remaining
        const subscription = await Subscription.findOne({
            user_id,
            expiry_date: { $gt: new Date() }
        });

        if (!subscription || subscription.uploads_remaining <= 0) {
            return res.status(403).json({ error: 'No uploads left. Please renew your subscription.' });
        }

        // STEP 2: Check if business exists
        let business;
        if (address && address.trim() !== '') {
            business = await Business.findOne({ name: business_name, address: address });
        } else {
            business = await Business.findOne({ name: business_name });
        }

        let businessId;

        if (business) {
            businessId = business._id;

            // 🎮 ANTI-GAMING: Check if user already reviewed this business in last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentReview = await Review.findOne({
                user_id,
                business_id: businessId,
                createdAt: { $gt: sevenDaysAgo }
            });

            if (recentReview) {
                return res.status(429).json({
                    error: 'You can only review this business once every 7 days',
                    lastReview: recentReview.createdAt
                });
            }
        } else {
            // Insert new business if it doesn't exist
            const hasCoordinates = latitude && longitude && !isNaN(latitude) && !isNaN(longitude);

            if (hasCoordinates) {
                console.log(`📍 Using Google Places coordinates: ${latitude}, ${longitude}`);
                business = new Business({
                    name: business_name,
                    category: category || null,
                    description: description || null,
                    location: location || null,
                    division: division || null,
                    address: address || null,
                    contact: contact || null,
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    place_id: place_id || null
                });
                await business.save();
                businessId = business._id;
                console.log(`✅ Business created with GPS coordinates from Google Places`);
            } else {
                // Fallback to geocoding
                const fullAddress = `${business_name}, ${address || ''}, ${location || ''}, ${division || ''}`.trim();
                console.log(`🗺️ Geocoding address: ${fullAddress}`);

                try {
                    const coords = await getCoordinatesFromAddress(fullAddress);
                    business = new Business({
                        name: business_name,
                        category: category || null,
                        description: description || null,
                        location: location || null,
                        division: division || null,
                        address: address || null,
                        contact: contact || null,
                        latitude: coords?.latitude || null,
                        longitude: coords?.longitude || null,
                        place_id: place_id || null
                    });
                    await business.save();
                    businessId = business._id;

                    if (coords) {
                        console.log(`📍 Business coordinates saved via geocoding: ${coords.latitude}, ${coords.longitude}`);
                    } else {
                        console.log('⚠️ Could not geocode address - GPS check-in will not work for this business');
                    }
                } catch (geocodeErr) {
                    console.error('Geocoding error:', geocodeErr);
                    // Continue anyway without coordinates
                    business = new Business({
                        name: business_name,
                        category: category || null,
                        description: description || null,
                        location: location || null,
                        division: division || null,
                        address: address || null,
                        contact: contact || null,
                        place_id: place_id || null
                    });
                    await business.save();
                    businessId = business._id;
                    console.log('⚠️ Business created without GPS coordinates');
                }
            }
        }

        // STEP 3: Insert review
        let tagsArray = [];

if (Array.isArray(tags)) {
    tagsArray = tags;
} else if (typeof tags === 'string') {
    try {
        tagsArray = JSON.parse(tags);
    } catch {
        tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    }
}

        
        const review = new Review({
            user_id,
            business_id: businessId,
            rating: rating || null,
            text: text || null,
            tags: tagsArray
        });

        const savedReview = await review.save();
        const reviewId = savedReview._id.toString();

        // STEP 4: Handle media upload if exists
        if (mediaFiles.length > 0) {
            const mediaPromises = mediaFiles.map(file => {
                const inferredType = file.mimetype && file.mimetype.startsWith('video') ? 'video' : 'image';
                const media = new Media({
                    business_id: businessId,
                    review_id: savedReview._id,
                    media_url: file.filename,
                    media_type: inferredType
                });
                return media.save();
            });
            await Promise.all(mediaPromises);
        }

        // STEP 5: Points calculation
        let pointsToAdd = 10; // Base review points
        if (mediaFiles.length > 0) pointsToAdd += 5; // Media bonus

        // Check if this is the first review for the business
        const reviewCount = await Review.countDocuments({ business_id: businessId });
        if (reviewCount === 1) {
            pointsToAdd *= 2; // double if first review
        }

        // 🎮 Use gamification system with daily cap
        awardPoints(user_id, pointsToAdd, async (err, actualPointsAwarded) => {
            if (err) console.error('Points award error:', err);

            // STEP 6: Check for achievements
            checkMilestones(user_id, (err2, newAchievements) => {
                if (err2) console.error('Milestone check error:', err2);

                // STEP 7: Decrement uploads from subscription
                subscription.uploads_remaining -= 1;
                subscription.save().catch(err => {
                    console.error('Subscription update error:', err);
                });

                res.json({
                    message: 'Review submitted successfully',
                    review_id: reviewId,
                    points_awarded: actualPointsAwarded,
                    new_achievements: newAchievements || []
                });
            });
        });
    } catch (err) {
        console.error('Review submission error:', err);
        res.status(500).json({ error: 'Error saving review' });
    }
});

// React to a review (like/dislike) with author points adjustment
router.post('/:id/react', authenticateJWT, async (req, res) => {
    const reviewId = req.params.id;
    const user_id = req.user.id;
    const { reaction } = req.body;

    if (!['like', 'none'].includes(reaction)) {
        return res.status(400).json({ error: 'Invalid reaction. Must be: like or none' });
    }

    try {
        // Step 1: Get review author
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const authorId = review.user_id.toString();

        // 🎮 ANTI-GAMING: Prevent self-likes
        if (authorId === user_id) {
            return res.status(403).json({ error: 'You cannot react to your own review' });
        }

        // Step 2: Check existing reaction
        const existingReaction = await ReviewLike.findOne({
            user_id,
            review_id: reviewId
        });

        const hadReaction = !!existingReaction;
        const previousIsLike = hadReaction ? existingReaction.is_like : null;

        // Step 3: Calculate point changes for author
        let pointsChange = 0;

        if (reaction === 'none') {
            if (previousIsLike === true) {
                pointsChange = -2; // remove like bonus
            }
        } else {
            // reaction === 'like'
            if (!hadReaction) {
                pointsChange = 2; // new like
            } else if (previousIsLike !== true) {
                pointsChange = 2; // normalize to like
            }
        }

        // Step 4: Update or delete reaction
        if (reaction === 'none') {
            if (existingReaction) {
                await ReviewLike.deleteOne({ _id: existingReaction._id });
            }
            applyPointsChange(authorId, pointsChange, res);
        } else {
            // Insert or update reaction
            if (existingReaction) {
                existingReaction.is_like = true;
                await existingReaction.save();
            } else {
                const newLike = new ReviewLike({
                    user_id,
                    review_id: reviewId,
                    is_like: true
                });
                await newLike.save();
            }
            applyPointsChange(authorId, pointsChange, res);
        }

        function applyPointsChange(authorId, points, res) {
            if (points === 0) {
                return res.json({ message: 'Reaction updated', points_change: 0 });
            }

            if (points > 0) {
                awardPoints(authorId, points, (err5, actualPoints) => {
                    if (err5) console.error('Points award error:', err5);
                    res.json({
                        message: 'Reaction recorded',
                        points_change: actualPoints
                    });
                });
            } else {
                deductPoints(authorId, Math.abs(points), (err6) => {
                    if (err6) console.error('Points deduct error:', err6);
                    res.json({
                        message: 'Reaction recorded',
                        points_change: points
                    });
                });
            }
        }
    } catch (err) {
        console.error('Reaction error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// Get reactions (likes/dislikes) for a review
router.get('/:id/reactions', async (req, res) => {
    const reviewId = req.params.id;

    try {
        const likes = await ReviewLike.countDocuments({
            review_id: reviewId,
            is_like: true
        });

        res.json({
            likes,
            dislikes: 0
        });
    } catch (err) {
        console.error('Error fetching reactions:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

// Get a user's reaction to a review
router.get('/:id/reaction', async (req, res) => {
    const reviewId = req.params.id;
    const userId = req.query.user_id;

    if (!userId) {
        return res.status(400).json({ error: 'user_id is required as a query parameter' });
    }

    try {
        const reaction = await ReviewLike.findOne({
            review_id: reviewId,
            user_id: userId
        });

        if (reaction) {
            const reactionType = reaction.is_like === true ? 'like' : 'dislike';
            res.json({ reaction: reactionType });
        } else {
            res.json({ reaction: null });
        }
    } catch (err) {
        console.error('Error fetching user reaction:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// Delete a review
router.delete('/:id', authenticateJWT, async (req, res) => {
    const reviewId = req.params.id;
    const userId = req.user.id;

    try {
        const review = await Review.findOne({
            _id: reviewId,
            user_id: userId
        });

        if (!review) {
            return res.status(403).json({ error: 'Not authorized to delete this review.' });
        }

        await Review.deleteOne({ _id: reviewId });
        res.json({ message: 'Review deleted successfully.' });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ error: 'Server error during deletion.' });
    }
});

// Report a review
router.post('/:id/report', authenticateJWT, async (req, res) => {
    const reviewId = req.params.id;
    const userId = req.user.id;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
        return res.status(400).json({ error: 'Report reason is required.' });
    }

    try {
        const report = new ReviewReport({
            review_id: reviewId,
            user_id: userId,
            reason: reason.trim()
        });

        await report.save();
        res.json({ message: 'Review reported successfully.' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'You have already reported this review.' });
        }
        console.error('Error reporting review:', err);
        res.status(500).json({ error: 'Server error while reporting review.' });
    }
});

// DELETE a review by ID (admin only)
router.delete('/reported/:id', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    const reviewId = req.params.id;

    try {
        const review = await Review.findByIdAndDelete(reviewId);

        if (!review) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        res.json({ message: 'Review deleted successfully.' });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

module.exports = router;

