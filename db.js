// db.js - MongoDB connection using Mongoose
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB Atlas
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

// Import and export all models
const User = require('./models/User');
const Business = require('./models/Business');
const Review = require('./models/Review');
const Media = require('./models/Media');
const ReviewLike = require('./models/ReviewLike');
const ReviewReport = require('./models/ReviewReport');
const Subscription = require('./models/Subscription');
const Transaction = require('./models/Transaction');
const Checkin = require('./models/Checkin');
const Reservation = require('./models/Reservation');
const UserAchievement = require('./models/UserAchievement');

// Export connection and all models
module.exports = {
    connectDB,
    mongoose,
    User,
    Business,
    Review,
    Media,
    ReviewLike,
    ReviewReport,
    Subscription,
    Transaction,
    Checkin,
    Reservation,
    UserAchievement
};
