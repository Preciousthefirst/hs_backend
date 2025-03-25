const express = require('express');
const router = express.Router(); // Define the router object
const db = require('../db.js'); 
const authenticateJWT = require('../middleware/authenticateJWT');

router.get('/', (req, res) => {
    const query = 'SELECT * FROM spots';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
//add new spots//changed from '/spots' to just/ across all the CRUD routes
router.post('/', authenticateJWT, (req, res) => {
//console.log('POST /spots hit'); // Log when the route is accessed
//console.log('Request body:', req.body)


    const { title, description, price, location, created_by } = req.body;
    const query = 'INSERT INTO spots (title, description, price, location, created_by) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [title, description, price, location, created_by], (err, result) => {
        if (err) {
            console.error('Database query error:',err)
            return res.status(500).json({ error: err.message });
        }

        console.log('Spot added with ID:', result.insertId); 

        res.status(201).json({ message: 'Spot added successfully', spotId: result.insertId });
    });
});

module.exports = router;