const mongoose = require('mongoose');

const reviewLikeSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    review_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        required: true
    },
    is_like: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    timestamps: true
});

// Unique constraint: one like/dislike per user per review
reviewLikeSchema.index({ user_id: 1, review_id: 1 }, { unique: true });

module.exports = mongoose.model('ReviewLike', reviewLikeSchema);

