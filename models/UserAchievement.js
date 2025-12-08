const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    achievement_type: {
        type: String,
        required: true,
        trim: true
    },
    awarded_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Unique constraint: one achievement type per user
userAchievementSchema.index({ user_id: 1, achievement_type: 1 }, { unique: true });

module.exports = mongoose.model('UserAchievement', userAchievementSchema);

