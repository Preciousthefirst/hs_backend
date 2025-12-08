const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    description: {
        type: String
    },
    location: {
        type: String,
        trim: true
    },
    division: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    contact: {
        type: String,
        trim: true
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    },
    place_id: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for faster queries
businessSchema.index({ place_id: 1 });
businessSchema.index({ name: 'text', category: 'text' }); // Text search

module.exports = mongoose.model('Business', businessSchema);

