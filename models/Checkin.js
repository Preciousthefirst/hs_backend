const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    business_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    }
}, {
    timestamps: true
});

// Unique constraint: one check-in per user per business (enforced at application level for 24h rule)
checkinSchema.index({ user_id: 1, business_id: 1, createdAt: -1 });

module.exports = mongoose.model('Checkin', checkinSchema);

