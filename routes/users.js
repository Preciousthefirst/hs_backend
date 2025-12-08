const express = require('express');
const router = express.Router();
const { User, Review, Checkin, Subscription, ReviewLike } = require('../db.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/authenticateJWT.js');
const authorizeRole = require('../middleware/authorizeRole.js');
const { getUserLevel, getUserAchievements } = require('../utils/gamification');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET;
console.log('JWT_SECRET:', SECRET_KEY);

// Get all users (Admin only)
router.get('/admin/all', verifyToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }).lean();
        
        const usersWithStats = await Promise.all(users.map(async (u) => {
            const reviewCount = await Review.countDocuments({ user_id: u._id });
            const checkinCount = await Checkin.countDocuments({ user_id: u._id });
            const subscription = await Subscription.findOne({ user_id: u._id });
            
            const subscription_status = subscription && subscription.expiry_date > new Date() 
                ? 'active' 
                : 'none';
            
            return {
                id: u._id.toString(),
                name: u.name,
                email: u.email,
                role: u.role,
                points: u.points,
                level: u.level,
                created_at: u.createdAt,
                review_count,
                checkin_count,
                subscription_status
            };
        }));
        
        res.json(usersWithStats);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get user statistics (Admin only)
router.get('/admin/stats', verifyToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        const total_users = await User.countDocuments();
        const admin_count = await User.countDocuments({ role: 'admin' });
        const regular_users = await User.countDocuments({ role: 'user' });
        const new_today = await User.countDocuments({ createdAt: { $gte: today } });
        const new_this_week = await User.countDocuments({ createdAt: { $gte: weekAgo } });
        const new_this_month = await User.countDocuments({ createdAt: { $gte: monthAgo } });
        
        res.json({
            total_users,
            admin_count,
            regular_users,
            new_today,
            new_this_week,
            new_this_month
        });
    } catch (err) {
        console.error('Error fetching user stats:', err);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Register a new user
router.post('/', async (req, res) => {
    console.log('POST /users hit');
    console.log('Request body:', req.body);

    const { name, email, password, role } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'user'
        });

        const savedUser = await user.save();
        res.status(201).json({ 
            message: 'User registered successfully', 
            userId: savedUser._id.toString() 
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id.toString(), email: user.email, role: user.role },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.json({ 
            message: 'Login successful', 
            token, 
            id: user._id.toString() 
        });
    } catch (error) {
        console.error('Error in /login route:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Get user by ID (simple endpoint for basic user info)
router.get('/:id', verifyToken, async (req, res) => {
    const userId = req.params.id;
    
    try {
        // Only allow users to get their own info, or admins to get any user
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const user = await User.findById(userId).select('name email role points level createdAt');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            points: user.points,
            level: user.level,
            created_at: user.createdAt
        });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// 🎮 Get user profile with gamification data
router.get('/:id/profile', async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get level info
        const levelInfo = getUserLevel(user.points);

        // Get user stats
        const review_count = await Review.countDocuments({ user_id: user._id });
        const checkin_count = await Checkin.countDocuments({ user_id: user._id });
        
        // Get total likes received
        const userReviews = await Review.find({ user_id: user._id }).select('_id');
        const reviewIds = userReviews.map(r => r._id);
        const total_likes_received = await ReviewLike.countDocuments({ 
            review_id: { $in: reviewIds }, 
            is_like: true 
        });
        
        // Get distinct businesses reviewed
        const businesses_reviewed = await Review.distinct('business_id', { user_id: user._id });

        // Get achievements
        getUserAchievements(userId, async (err3, achievements) => {
            if (err3) {
                console.error('Achievements fetch error:', err3);
            }

            // Get user rank
            const usersWithMorePoints = await User.countDocuments({ 
                points: { $gt: user.points } 
            });
            const rank = usersWithMorePoints + 1;

            // Calculate daily points remaining
            const today = new Date().toISOString().split('T')[0];
            const pointsResetDate = user.points_reset_date 
                ? new Date(user.points_reset_date).toISOString().split('T')[0] 
                : null;
            const pointsToday = pointsResetDate === today ? user.points_today : 0;
            const dailyPointsRemaining = Math.max(0, 500 - pointsToday);

            res.json({
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    points: user.points,
                    level: levelInfo,
                    rank,
                    member_since: user.createdAt
                },
                stats: {
                    reviews: review_count,
                    checkins: checkin_count,
                    likes_received: total_likes_received,
                    businesses_reviewed: businesses_reviewed.length
                },
                achievements: achievements || [],
                daily_limit: {
                    points_earned_today: pointsToday,
                    points_remaining_today: dailyPointsRemaining,
                    cap: 500
                }
            });
        });
    } catch (err) {
        console.error('User profile fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// Delete a user
router.delete('/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
    const userId = req.params.id;

    try {
        // Delete associated reviews, checkins, etc. (MongoDB will handle references)
        await Review.deleteMany({ user_id: userId });
        await Checkin.deleteMany({ user_id: userId });
        await ReviewLike.deleteMany({ user_id: userId });
        
        // Delete the user
        const user = await User.findByIdAndDelete(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User and associated reviews deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: err.message });
    }
});

// Users updating details, admin and roles and the like.
router.put('/:id', verifyToken, async (req, res) => {
    const { name, email, role, password } = req.body;
    const userId = req.params.id;

    try {
        // Only allow users to update their own info, or admins to update any user
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updateFields = {};
        
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (role && req.user.role === 'admin') updateFields.role = role;
        if (password) {
            updateFields.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: err.message });
    }
});

// Example of a protected route
router.get('/profile', verifyToken, (req, res) => {
    res.json({ message: 'Profile access granted', user: req.user });
});

// ============================================================================
// Admin Routes
// ============================================================================

// Update user role (Admin only)
router.put('/admin/:id/role', verifyToken, authorizeRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Valid role (user or admin) is required' });
    }

    try {
        const user = await User.findByIdAndUpdate(
            id,
            { $set: { role } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User role updated successfully' });
    } catch (err) {
        console.error('Error updating user role:', err);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Delete user (Admin only)
router.delete('/admin/:id', verifyToken, authorizeRole(['admin']), async (req, res) => {
    const { id } = req.params;

    try {
        // Prevent admin from deleting themselves
        if (id === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Ban/Unban user (Admin only)
router.put('/admin/:id/ban', verifyToken, authorizeRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { banned } = req.body;

    if (typeof banned !== 'boolean') {
        return res.status(400).json({ error: 'banned field must be a boolean' });
    }

    try {
        const newRole = banned ? 'banned' : 'user';
        const user = await User.findByIdAndUpdate(
            id,
            { $set: { role: newRole } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: `User ${banned ? 'banned' : 'unbanned'} successfully` });
    } catch (err) {
        console.error('Error updating user status:', err);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

module.exports = router;
