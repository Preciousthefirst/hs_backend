const express = require('express');
const router = express.Router();
const { Subscription, User } = require('../db.js');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

// ============================================================================
// 1️⃣ GET /subscriptions/user/:userId — Get User's Current Subscription
// ============================================================================
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const subscription = await Subscription.findOne({ user_id: userId });

        if (!subscription) {
            return res.status(404).json({ 
                error: "No subscription found",
                message: "User has no active subscription"
            });
        }

        const status = subscription.expiry_date > new Date() ? 'active' : 'expired';

        res.json({
            id: subscription._id.toString(),
            user_id: subscription.user_id.toString(),
            uploads_remaining: subscription.uploads_remaining,
            start_date: subscription.start_date,
            expiry_date: subscription.expiry_date,
            status
        });
    } catch (err) {
        console.error('Subscription lookup error:', err);
        res.status(500).json({ error: "Failed to fetch subscription" });
    }
});

// ============================================================================
// 2️⃣ GET /subscriptions/:userId/status — Check if Subscription is Active
// ============================================================================
router.get('/:userId/status', async (req, res) => {
    const { userId } = req.params;

    try {
        const subscription = await Subscription.findOne({ user_id: userId });

        if (!subscription) {
            return res.json({ 
                status: 'none',
                message: 'No subscription found',
                can_upload: false
            });
        }

        const now = new Date();
        const isExpired = subscription.expiry_date <= now;
        const hasUploads = subscription.uploads_remaining > 0;

        let status;
        if (isExpired) {
            status = 'expired';
        } else if (!hasUploads) {
            status = 'depleted';
        } else {
            status = 'active';
        }

        const canUpload = status === 'active';

        res.json({
            status,
            uploads_remaining: subscription.uploads_remaining,
            expiry_date: subscription.expiry_date,
            can_upload: canUpload,
            message: canUpload 
                ? 'Subscription is active' 
                : status === 'expired'
                    ? 'Subscription has expired'
                    : 'No uploads remaining'
        });
    } catch (err) {
        console.error('Status check error:', err);
        res.status(500).json({ error: "Failed to check subscription status" });
    }
});

// ============================================================================
// 3️⃣ GET /subscriptions/admin/all — Get All Subscriptions (Admin Only)
// ============================================================================
router.get('/admin/all', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    try {
        const subscriptions = await Subscription.find()
            .populate('user_id', 'name email points')
            .sort({ start_date: -1 })
            .lean();

        const formattedSubscriptions = subscriptions.map(sub => ({
            id: sub._id.toString(),
            user_id: sub.user_id._id.toString(),
            username: sub.user_id.name,
            email: sub.user_id.email,
            points: sub.user_id.points,
            uploads_remaining: sub.uploads_remaining,
            start_date: sub.start_date,
            expiry_date: sub.expiry_date,
            status: sub.expiry_date > new Date() ? 'active' : 'expired'
        }));

        res.json(formattedSubscriptions);
    } catch (err) {
        console.error('Subscriptions lookup error:', err);
        res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
});

// ============================================================================
// 4️⃣ GET /subscriptions/admin/stats — Get Subscription Statistics (Admin Only)
// ============================================================================
router.get('/admin/stats', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    try {
        const subscriptions = await Subscription.find().lean();

        const total_subscriptions = subscriptions.length;
        const active_subscriptions = subscriptions.filter(s => s.expiry_date > new Date()).length;
        const expired_subscriptions = subscriptions.filter(s => s.expiry_date <= new Date()).length;
        
        const totalUploads = subscriptions.reduce((sum, s) => sum + s.uploads_remaining, 0);
        const avg_uploads_remaining = subscriptions.length > 0 
            ? totalUploads / subscriptions.length 
            : 0;

        res.json({
            total_subscriptions,
            active_subscriptions,
            expired_subscriptions,
            avg_uploads_remaining: Math.round(avg_uploads_remaining * 100) / 100,
            total_uploads_remaining: totalUploads
        });
    } catch (err) {
        console.error('Subscription stats error:', err);
        res.status(500).json({ error: "Failed to fetch subscription statistics" });
    }
});

// ============================================================================
// 5️⃣ PUT /subscriptions/admin/:id — Update Subscription (Admin Only)
// ============================================================================
router.put('/admin/:id', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { uploads_remaining, expiry_date } = req.body;

    if (uploads_remaining === undefined && !expiry_date) {
        return res.status(400).json({ error: "At least one field (uploads_remaining or expiry_date) is required" });
    }

    try {
        const subscription = await Subscription.findById(id);

        if (!subscription) {
            return res.status(404).json({ error: "Subscription not found" });
        }

        if (uploads_remaining !== undefined) {
            subscription.uploads_remaining = uploads_remaining;
        }

        if (expiry_date) {
            subscription.expiry_date = new Date(expiry_date);
        }

        await subscription.save();

        res.json({ message: "Subscription updated successfully" });
    } catch (err) {
        console.error('Subscription update error:', err);
        res.status(500).json({ error: "Failed to update subscription" });
    }
});

module.exports = router;
