const express = require('express');
const router = express.Router();
const db = require('../db.js');
const authenticateJWT = require('../middleware/authenticateJWT');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

//storage setup
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, JPG and MP4 files are allowed'));
        }
    }
});



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
router.post('/', authenticateJWT, upload.array('media', 5), (req, res) => {
    const { title, description, price, location, created_by } = req.body;
    const files = req.files; 

    const insertSpot = `
        INSERT INTO spots (title, description, price, location, created_by)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(insertSpot, [title, description, price, location, created_by], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const spotId = result.insertId;

        if (!files || files.length === 0) {
            return res.status(201).json({ message: 'Spot created without media.', spotId });
        }

        const mediaValues = files.map(file => [
            spotId,
            file.filename,
            file.mimetype.startsWith('image') ? 'image' : 'video'
        ]);

        const insertMedia = `INSERT INTO media (spot_id, media_url, media_type) VALUES ?`;

        db.query(insertMedia, [mediaValues], (mediaErr) => {
            if (mediaErr) return res.status(500).json({ error: mediaErr.message });

            res.status(201).json({ message: 'Spot and media uploaded successfully!', spotId });
        });
    });

});

// Get all media for a spot(essentially a gallery)
router.get('/:id/media', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT media_url, media_type FROM media WHERE spot_id = ?';
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        // Return full URLs for each media file
        const media = results.map(item => ({
            url: `${req.protocol}://${req.get('host')}/uploads/${item.media_url}`,
            type: item.media_type
        }));
        res.json(media);
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

// Delete a media file by its ID
router.delete('/media/:mediaId', (req, res) => {
    const { mediaId } = req.params;
    // First, get the filename from the database
    const selectQuery = 'SELECT media_url FROM media WHERE id = ?';
    db.query(selectQuery, [mediaId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Media not found' });

        const filename = results[0].media_url;
        const filePath = path.join(__dirname, '..', 'uploads', filename);

        // Delete from database
        const deleteQuery = 'DELETE FROM media WHERE id = ?';
        db.query(deleteQuery, [mediaId], (deleteErr) => {
            if (deleteErr) return res.status(500).json({ error: deleteErr.message });

            // Delete file from filesystem
            fs.unlink(filePath, (fsErr) => {
                // If file doesn't exist, ignore error
                if (fsErr && fsErr.code !== 'ENOENT') {
                    return res.status(500).json({ error: fsErr.message });
                }
                res.json({ message: 'Media deleted successfully' });
            });
        });
    });
});

// Get spot by ID with media
router.get('/:id', (req, res) => {
    const spotId = req.params.id;

    // Fetch the spot itself
    db.query('SELECT * FROM spots WHERE id = ?', [spotId], (err, spotResults) => {
        if (err) return res.status(500).json({ message: 'Error fetching spot' });

        if (spotResults.length === 0) {
            return res.status(404).json({ message: 'Spot not found' });
        }

        const spot = spotResults[0];

        // Fetch associated media
        db.query(
            'SELECT id, media_url, media_type FROM media WHERE spot_id = ?',
            [spotId],
            (mediaErr, mediaResults) => {
                if (mediaErr) return res.status(500).json({ message: 'Error fetching media' });

                spot.media = mediaResults; // Add media to the spot object

                res.json(spot);
            }
        );
    });
});

// Add a review to a spot
router.post('/:id/reviews', authenticateJWT, (req, res) => {
    const spotId = req.params.id;
    const userId = req.user.id; // From JWT
    const { rating, text, tags } = req.body;

    if (!rating || !text) {
        return res.status(400).json({ error: 'Rating and text are required.' });
    }

    const insertReview = `
        INSERT INTO reviews (spot_id, user_id, rating, text, tags, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;

    db.query(insertReview, [spotId, userId, rating, text, tags], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Review added successfully', reviewId: result.insertId });
    });
});

// Get all reviews for a spot
router.get('/:id/reviews', (req, res) => {
    const spotId = req.params.id;
    const query = 'SELECT * FROM reviews WHERE spot_id = ? ORDER BY created_at DESC';
    db.query(query, [spotId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get paginated & sorted reviews for a spot
router.get('/:spotId/reviews', (req, res) => {
    const spotId = req.params.spotId;
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 reviews per page
    const sortBy = req.query.sortBy || 'created_at'; // 'created_at' or 'rating'
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC'; // Default to DESC

    // Validate sortBy
    const allowedSort = ['created_at', 'rating'];
    const sortColumn = allowedSort.includes(sortBy) ? sortBy : 'created_at';

    const offset = (page - 1) * limit;

    const query = `
        SELECT * FROM reviews
        WHERE spot_id = ?
        ORDER BY ${sortColumn} ${order}
        LIMIT ? OFFSET ?
    `;

    db.query(query, [spotId, limit, offset], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            page,
            limit,
            sortBy: sortColumn,
            order,
            reviews: results
        });
    });
});

// Delete a review by its ID (only the review's author or an admin should be allowed)
router.delete('/reviews/:reviewId', authenticateJWT, (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Optional: Check if the user is the author of the review
    const checkQuery = 'SELECT * FROM reviews WHERE id = ? AND user_id = ?';
    db.query(checkQuery, [reviewId, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(403).json({ error: 'You are not authorized to delete this review' });
        }

        const deleteQuery = 'DELETE FROM reviews WHERE id = ?';
        db.query(deleteQuery, [reviewId], (deleteErr) => {
            if (deleteErr) return res.status(500).json({ error: deleteErr.message });
            res.json({ message: 'Review deleted successfully' });
        });
    });
});

// Edit a review by its ID (only the review's author or an admin should be allowed)
router.put('/reviews/:reviewId', authenticateJWT, (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, text, tags } = req.body;

    // Optional: Check if the user is the author of the review
    const checkQuery = 'SELECT * FROM reviews WHERE id = ? AND user_id = ?';
    db.query(checkQuery, [reviewId, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(403).json({ error: 'You are not authorized to edit this review' });
        }

        const updateQuery = 'UPDATE reviews SET rating = ?, text = ?, tags = ? WHERE id = ?';
        db.query(updateQuery, [rating, text, tags, reviewId], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            res.json({ message: 'Review updated successfully' });
        });
    });
});



module.exports = router;
