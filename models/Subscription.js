const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    uploads_remaining: {
        type: Number,
        default: 10,
        min: 0
    },
    start_date: {
        type: Date,
        default: Date.now
    },
    expiry_date: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Index
// Note: user_id already has unique: true which creates an index automatically
subscriptionSchema.index({ expiry_date: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);

