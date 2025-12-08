const express = require('express');
const router = express.Router();
const { User, Review, Checkin, UserAchievement } = require('../db.js');
const { getUserLevel } = require('../utils/gamification');

// ============================================================================
// 🏆 GET /leaderboard — Get top users by points
// ============================================================================
router.get('/', async (req, res) => {
    const { range = 'all', limit = 50 } = req.query;

    try {
        let timeCondition = {};
        
        if (range === 'weekly') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            timeCondition = { createdAt: { $gte: weekAgo } };
        } else if (range === 'monthly') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            timeCondition = { createdAt: { $gte: monthAgo } };
        }

        const users = await User.find(timeCondition)
            .sort({ points: -1, createdAt: 1 })
            .limit(parseInt(limit))
            .lean();

        const leaderboard = await Promise.all(users.map(async (user, index) => {
            const review_count = await Review.countDocuments({ user_id: user._id });
            const checkin_count = await Checkin.countDocuments({ user_id: user._id });
            const achievement_count = await UserAchievement.countDocuments({ user_id: user._id });
            
            const levelInfo = getUserLevel(user.points);
            
            return {
                rank: index + 1,
                user_id: user._id.toString(),
                username: user.name,
                points: user.points,
                level: levelInfo,
                stats: {
                    reviews: review_count,
                    checkins: checkin_count,
                    achievements: achievement_count
                },
                member_since: user.createdAt
            };
        }));

        res.json({
            range,
            total_users: leaderboard.length,
            leaderboard
        });
    } catch (err) {
        console.error('Leaderboard fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// ============================================================================
// 🏆 GET /leaderboard/user/:userId — Get user's rank and nearby users
// ============================================================================
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId).lean();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const review_count = await Review.countDocuments({ user_id: user._id });
        const checkin_count = await Checkin.countDocuments({ user_id: user._id });
        const achievement_count = await UserAchievement.countDocuments({ user_id: user._id });

        // Get user's rank
        const usersWithMorePoints = await User.countDocuments({ 
            points: { $gt: user.points } 
        });
        const rank = usersWithMorePoints + 1;

        const levelInfo = getUserLevel(user.points);

        // Get nearby users (5 above and 5 below)
        const usersAbove = await User.find({ points: { $gt: user.points } })
            .sort({ points: 1 })
            .limit(5)
            .select('name points level')
            .lean();

        const usersBelow = await User.find({ 
            points: { $lte: user.points },
            _id: { $ne: user._id }
        })
            .sort({ points: -1 })
            .limit(5)
            .select('name points level')
            .lean();

        const nearby = [...usersAbove, ...usersBelow]
            .sort((a, b) => b.points - a.points)
            .map(u => ({
                id: u._id.toString(),
                name: u.name,
                points: u.points,
                level: u.level
            }));

        res.json({
            user: {
                id: user._id.toString(),
                name: user.name,
                points: user.points,
                rank,
                level: levelInfo,
                stats: {
                    reviews: review_count,
                    checkins: checkin_count,
                    achievements: achievement_count
                }
            },
            nearby_users: nearby
        });
    } catch (err) {
        console.error('User leaderboard fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch user leaderboard' });
    }
});

module.exports = router;
