const mongoose = require('mongoose');

const reviewReportSchema = new mongoose.Schema({
    review_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

// Unique constraint: one report per user per review
reviewReportSchema.index({ user_id: 1, review_id: 1 }, { unique: true });

module.exports = mongoose.model('ReviewReport', reviewReportSchema);

