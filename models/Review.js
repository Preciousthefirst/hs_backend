const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    business_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    text: {
        type: String,
        trim: true
    },
    tags: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

// Indexes for faster queries
reviewSchema.index({ user_id: 1 });
reviewSchema.index({ business_id: 1 });
reviewSchema.index({ rating: -1, createdAt: -1 }); // For top reviews
reviewSchema.index({ tags: 1 }); // For tag search

module.exports = mongoose.model('Review', reviewSchema);

