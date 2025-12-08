const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    people: {
        type: Number,
        required: true,
        min: 1
    },
    special_requests: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected', 'completed', 'no-show'],
        default: 'pending'
    },
    confirmation_token: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true
});

// Indexes
// Note: confirmation_token already has unique: true which creates an index automatically
reservationSchema.index({ user_id: 1 });
reservationSchema.index({ business_id: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);

