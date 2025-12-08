const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    business_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    review_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    },
    media_url: {
        type: String,
        required: true
    },
    media_type: {
        type: String,
        enum: ['image', 'video'],
        default: 'image'
    }
}, {
    timestamps: true
});

// Indexes
mediaSchema.index({ business_id: 1 });
mediaSchema.index({ review_id: 1 });

module.exports = mongoose.model('Media', mediaSchema);

