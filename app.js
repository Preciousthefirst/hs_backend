const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
//app.use(bodyParser.json());
app.use(express.json());


// Import routes
const userRoutes = require('./routes/users'); 
const spotRoutes = require('./routes/spots');
const reviewRoutes = require('./routes/reviews');


// Use routes
app.use('/users', userRoutes);
app.use('/spots', spotRoutes);
app.use('/reviews', reviewRoutes);
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
