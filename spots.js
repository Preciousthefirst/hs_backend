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

//update a spot(PUT)
router.put('/:id', authenticateJWT, (req, res) => {
    const { title, description, price, location } = req.body;
    const { id } = req.params;

    const query = 'UPDATE spots SET title = ?, description = ?, price = ?, location = ? WHERE id = ?';
    db.query(query, [title, description, price, location, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Spot not found' });
        }
        res.json({ message: 'Spot updated successfully' });
    });
});

//delete a spot(DELETE)
router.delete('/:id', authenticateJWT, (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM spots WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Spot not found' });
        }
        res.json({ message: 'Spot deleted successfully' });
    });
});

module.exports = router;