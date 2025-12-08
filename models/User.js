const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    points: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    points_today: {
        type: Number,
        default: 0
    },
    points_reset_date: {
        type: Date
    },
    username: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Index for faster queries
// Note: email already has unique: true which creates an index automatically
userSchema.index({ points: -1 }); // For leaderboard

module.exports = mongoose.model('User', userSchema);

