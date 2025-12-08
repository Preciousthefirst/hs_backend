const express = require('express');
const router = express.Router(); // Define the router object
const db = require('../db.js'); 
const authenticateJWT = require('../middleware/authenticateJWT'); // Make sure this is imported
const authorizeRole = require('../middleware/authorizeRole');

// Get top-rated reviews globally
router.get('/top', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    const query = `
        SELECT r.*, u.username 
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.rating DESC, r.created_at DESC
        LIMIT ?
    `;

    db.query(query, [limit], (err, results) => {
        if (err) return res.status(500).json({ error: 'Server error.' });
        res.json(results);
    });
});

// Get top-rated reviews for a specific spot
router.get('/spot/:spotId/top', (req, res) => {
    const spotId = req.params.spotId;
    const limit = parseInt(req.query.limit) || 5;

    const query = `
        SELECT r.*, u.username 
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.spot_id = ?
        ORDER BY r.rating DESC, r.created_at DESC
        LIMIT ?
    `;

    db.query(query, [spotId, limit], (err, results) => {
        if (err) return res.status(500).json({ error: 'Server error.' });
        res.json(results);
    });
});

// Get reported reviews (for admin/moderation)
router.get('/reported/all', authenticateJWT, authorizeRole(['admin']), (req, res) => {
    const query = `
        SELECT
            r.id AS review_id,
            r.text AS review_content,
            COUNT(rr.id) AS report_count,
            GROUP_CONCAT(rr.reason SEPARATOR '; ') AS report_reasons,
            GROUP_CONCAT(u.name SEPARATOR '; ') AS reporting_users
        FROM
            review_reports rr
        JOIN
            reviews r ON rr.review_id = r.id
        JOIN
            users u ON rr.user_id = u.id
        GROUP BY
            r.id
        ORDER BY
            report_count DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching reported reviews:', err);
            return res.status(500).json({ error: 'Server error.' });
        }

        res.json(results);
    });
});

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

// React to a review (like/dislike)
router.post('/:id/react', (req, res) => {
    const reviewId = req.params.id;
    const { user_id, reaction } = req.body;

    if (!user_id || !['like', 'dislike'].includes(reaction)) {
        return res.status(400).json({ error: 'Invalid user or reaction' });
    }

    // Convert reaction to is_like integer
    const is_like = reaction === 'like' ? 1 : 0;

    const query = `
        INSERT INTO review_likes (user_id, review_id, is_like)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE is_like = VALUES(is_like)
    `;

    db.query(query, [user_id, reviewId, is_like], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        res.json({ message: 'Reaction recorded or updated' });
    });
});

// Get reactions (likes/dislikes) for a review
router.get('/:id/reactions', (req, res) => {
    const reviewId = req.params.id;

    const likesQuery = `
        SELECT COUNT(*) as likes FROM review_likes
        WHERE review_id = ? AND is_like = 1
    `;
    const dislikesQuery = `
        SELECT COUNT(*) as dislikes FROM review_likes
        WHERE review_id = ? AND is_like = 0
    `;

    db.query(likesQuery, [reviewId], (err, likesResult) => {
        if (err) return res.status(500).json({ error: 'Server error.' });

        db.query(dislikesQuery, [reviewId], (err2, dislikesResult) => {
            if (err2) return res.status(500).json({ error: 'Server error.' });

            res.json({
                likes: likesResult[0].likes,
                dislikes: dislikesResult[0].dislikes
            });
        });
    });
});

// Get a user's reaction to a review
router.get('/:id/reaction', (req, res) => {
    const reviewId = req.params.id;
    const userId = req.query.user_id;

    if (!userId) {
        return res.status(400).json({ error: 'user_id is required as a query parameter' });
    }

    const query = `
        SELECT is_like FROM review_likes WHERE review_id = ? AND user_id = ?
    `;

    db.query(query, [reviewId, userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        if (rows.length > 0) {
            // Convert is_like integer back to 'like' or 'dislike'
            const reaction = rows[0].is_like === 1 ? 'like' : 'dislike';
            res.json({ reaction });
        } else {
            res.json({ reaction: null }); // No reaction yet
        }
    });
});

router.get('/', (req, res) => {
    const spotId = req.query.spot_id;

    if (!spotId) {
        return res.status(400).json({ error: 'Missing spot_id in query' });
    }

    // Step 1: Get all reviews for the spot
    const reviewsQuery = 'SELECT * FROM reviews WHERE spot_id = ? ORDER BY created_at DESC';
    db.query(reviewsQuery, [spotId], (err, reviews) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err.message });

        if (!reviews.length) return res.json([]);

        let pending = reviews.length;

        reviews.forEach((review, idx) => {
            const reactionQuery = `
                SELECT 
                    SUM(reaction = 'like') AS likes,
                    SUM(reaction = 'dislike') AS dislikes
                FROM review_reactions
                WHERE review_id = ?
            `;
            db.query(reactionQuery, [review.id], (rErr, reaction) => {
                if (rErr) {
                    review.likes = 0;
                    review.dislikes = 0;
                } else {
                    review.likes = reaction[0].likes || 0;
                    review.dislikes = reaction[0].dislikes || 0;
                }

                pending--;
                if (pending === 0) {
                    res.json(reviews);
                }
            });
        });
    });
});

// Delete a review
router.delete('/:id', authenticateJWT, (req, res) => {
    const reviewId = req.params.id;
    const userId = req.user.id; // Assumes you're using authentication middleware

    // First check: Is the review owned by the user?
    const checkQuery = `SELECT * FROM reviews WHERE id = ? AND user_id = ?`;
    db.query(checkQuery, [reviewId, userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Server error.' });

        if (results.length === 0) {
            return res.status(403).json({ error: 'Not authorized to delete this review.' });
        }

        // Delete the review
        const deleteQuery = `DELETE FROM reviews WHERE id = ?`;
        db.query(deleteQuery, [reviewId], (err2) => {
            if (err2) return res.status(500).json({ error: 'Server error during deletion.' });

            res.json({ message: 'Review deleted successfully.' });
        });
    });
});

// Report a review
router.post('/:id/report', authenticateJWT, (req, res) => {
    const reviewId = req.params.id;
    const userId = req.user.id; // Set by authenticateJWT
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
        return res.status(400).json({ error: 'Report reason is required.' });
    }

    const insertQuery = `
        INSERT INTO review_reports (review_id, user_id, reason)
        VALUES (?, ?, ?)
    `;

    db.query(insertQuery, [reviewId, userId, reason], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'You have already reported this review.' });
            }
            return res.status(500).json({ error: 'Server error while reporting review.' });
        }

        res.json({ message: 'Review reported successfully.' });
    });
});



module.exports = router;