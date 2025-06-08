const express = require('express');
const router = express.Router();
const db = require('../db.js');
const authenticateJWT = require('../middleware/authenticateJWT');
const multer = require('multer');
const path = require('path');

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });



// GET all spots with optional filtering
router.get('/', (req, res) => {
    const { price, location, created_by, tags } = req.query;
    let query = 'SELECT * FROM spots';
    const queryParams = [];
    const conditions = [];

    if (price) {
        conditions.push('price = ?');
        queryParams.push(price);
    }
    if (location) {
        conditions.push('location = ?');
        queryParams.push(location);
    }
    if (created_by) {
        conditions.push('created_by = ?');
        queryParams.push(created_by);
    }
    if (tags) {
        conditions.push('tags LIKE ?');
        queryParams.push(`%${tags}%`);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    db.query(query, queryParams, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Add new spot with photo upload
router.post('/', authenticateJWT, upload.array('image'), (req, res) => {
    const { title, description, price, location, created_by } = req.body;
    const image = req.file ? req.file.filename : null;

    const query = 'INSERT INTO spots (title, description, price, location, created_by, image) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [title, description, price, location, created_by, image], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        res.status(201).json({
            message: 'Spot added successfully',
            spotId: result.insertId,
            image
        });
    });
});

// Update spot
router.put('/:id', authenticateJWT, (req, res) => {
    const { title, description, price, location } = req.body;
    const { id } = req.params;

    const query = 'UPDATE spots SET title = ?, description = ?, price = ?, location = ? WHERE id = ?';
    db.query(query, [title, description, price, location, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Spot not found' });
        res.json({ message: 'Spot updated successfully' });
    });
});

// Delete (Only creator can delete)
router.delete('/:id', authenticateJWT, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const checkQuery = 'SELECT * FROM spots WHERE id = ? AND created_by = ?';
    db.query(checkQuery, [id, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.status(403).json({ error: 'You are not authorized to delete this spot' });
        }

        const deleteQuery = 'DELETE FROM spots WHERE id = ?';
        db.query(deleteQuery, [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({ message: 'Spot deleted successfully' });
        });
    });
});

module.exports = router;
