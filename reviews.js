const express = require('express');
const router = express.Router(); // Define the router object
const db = require('../db.js'); 

//get reviews
router.get('/:spotId', (req, res) => {

    console.log('Received GET request for spotId:', req.params.spotId);
    const query = 'SELECT * FROM reviews WHERE spot_id = ?';
    db.query(query, [req.params.spotId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
//add a review
router.post('/', (req, res) => {

    console.log('Received POST request:', req.body);
    const { user_id, spot_id, rating, text, tags } = req.body;
    const query = 'INSERT INTO reviews (user_id, spot_id, rating, text, tags) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [user_id, spot_id, rating, text, JSON.stringify(tags)], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Review added successfully', reviewId: result.insertId });
    });
});

module.exports = router;