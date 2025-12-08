const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectDB } = require('./db');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB Atlas
connectDB();

// CORS configuration - allow multiple origins for dev and production
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Import routes
const userRoutes = require('./routes/users'); 
const spotRoutes = require('./routes/spots');
const reviewRoutes = require('./routes/reviews');
const transactionRoutes = require('./routes/transactions');
const subscriptionRoutes = require('./routes/subscriptions');
const checkinRoutes = require('./routes/checkins');
const leaderboardRoutes = require('./routes/leaderboard');
const businessRoutes = require('./routes/businesses');
const reservationRoutes = require('./routes/reservations');
//const reportRoutes = require('./routes/reports');

// Use routes
app.use('/users', userRoutes);
app.use('/spots', spotRoutes);
app.use('/reviews', reviewRoutes);
app.use('/transactions', transactionRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/checkins', checkinRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/businesses', businessRoutes);
app.use('/reservations', reservationRoutes);
//app.use('/reported', reportRoutes);
app.use('/uploads', express.static('uploads'));

console.log('User routes loaded');

// Middleware to log errors
app.use((err, req, res, next) => {
    console.error(err.stack);  // Logs errors to the console
    console.log('Error Details:', err); // Log additional error details
    res.status(500).json({ error: 'Something went wrong!' });
});

console.log('App is running and routes are set up');

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});