const express = require('express');
const router = express.Router(); // Define the router object
const db = require('../db.js'); 
const authenticateJWT = require('../middleware/authenticateJWT'); // Make sure this is imported
const authorizeRole = require('../middleware/authorizeRole');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { awardPoints, deductPoints, checkMilestones } = require('../utils/gamification');
const { getCoordinatesFromAddress } = require('../utils/geocoding');

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
/*router.get('/spot/:spotId/top', (req, res) => {
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
});*/

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
/*router.get('/:spotId', (req, res) => {

    console.log('Received GET request for spotId:', req.params.spotId);
    const query = 'SELECT * FROM reviews WHERE spot_id = ?';
    db.query(query, [req.params.spotId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});*/

// GET all reviews with business + media info (returns media as array)
router.get('/', (req, res) => {
    const query = `
        SELECT 
            r.id AS review_id, r.user_id, r.rating, r.text, r.tags, r.created_at, r.updated_at,
            b.name AS business_name, b.division, b.category, b.address,
            u.name AS username, u.points,
            m.id AS media_id, m.media_url, m.media_type,
            (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 1) AS likes,
            0 AS dislikes
        FROM reviews r
        JOIN businesses b ON r.business_id = b.id
        JOIN users u ON r.user_id = u.id
        LEFT JOIN media m ON r.business_id = m.business_id
        ORDER BY r.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching all reviews:', err);
            return res.status(500).json({ error: 'Error fetching all reviews' });
        }

        // 🧠 Rebuild response to group media by review
        const reviewsMap = new Map();

        results.forEach(row => {
            if (!reviewsMap.has(row.review_id)) {
                // Parse tags JSON if it exists
                let tags = [];
                try {
                    if (row.tags) {
                        tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
                    }
                } catch (e) {
                    console.error('Error parsing tags JSON:', e);
                }

                reviewsMap.set(row.review_id, {
                    id: row.review_id,
                    user_id: row.user_id,
                    username: row.username,
                    points: row.points,
                    rating: row.rating,
                    text: row.text,
                    tags: tags,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    business: {
                        name: row.business_name,
                        division: row.division,
                        category: row.category,
                        address: row.address
                    },
                    media: [],
                    likes: row.likes,
                    dislikes: row.dislikes
                });
            }

            if (row.media_id && row.media_url) {
                reviewsMap.get(row.review_id).media.push({
                    id: row.media_id,
                    url: row.media_url,
                    type: row.media_type
                });
            }
        });

        // Convert map → array
        const reviews = Array.from(reviewsMap.values());
        res.json(reviews);
    });
});

// ============================================================================
// 🔍 GET /reviews/search?q=keyword — Search reviews by tags (PUBLIC - no auth required)
// ============================================================================
// This is the core discovery feature: search for hangout spots by tags/moods
// Example: /reviews/search?q=date night OR /reviews/search?q=family group activities
router.get('/search', (req, res) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.json({
            query: q || '',
            results_count: 0,
            reviews: []
        });
    }

    // Split search query into individual words (for multi-word searches like "date night")
    const searchTerms = q.trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(term => term.length > 0);

    if (searchTerms.length === 0) {
        return res.json({
            query: q,
            results_count: 0,
            reviews: []
        });
    }

    // Build WHERE clause to match any of the search terms in the tags JSON
    // Tags are stored as JSON array, so we search using LIKE for case-insensitive matching
    // Match both JSON array format: ["tag1", "tag2"] and individual tags
    // Use OR for multiple search terms (reviews matching ANY term)
    const whereClause = searchTerms.map(() => `(LOWER(r.tags) LIKE ? OR LOWER(r.tags) LIKE ?)`).join(' OR ');
    const tagParams = searchTerms.flatMap(term => [`%"${term}"%`, `%${term}%`]); // Match JSON format and plain text

    const query = `
        SELECT 
            r.id AS review_id, 
            r.user_id, 
            r.rating, 
            r.text, 
            r.tags,
            r.created_at, 
            r.updated_at,
            b.id AS business_id,
            b.name AS business_name, 
            b.division, 
            b.category, 
            b.address,
            b.description AS business_description,
            u.name AS username, 
            u.points,
            m.id AS media_id, 
            m.media_url, 
            m.media_type,
            (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 1) AS likes,
            0 AS dislikes
        FROM reviews r
        JOIN businesses b ON r.business_id = b.id
        JOIN users u ON r.user_id = u.id
        LEFT JOIN media m ON r.business_id = m.business_id
        WHERE ${whereClause}
        ORDER BY r.created_at DESC
    `;

    db.query(query, tagParams, (err, results) => {
        if (err) {
            console.error('Error searching reviews by tags:', err);
            return res.status(500).json({ error: 'Error searching reviews' });
        }

        // 🧠 Group media by review (same structure as global /reviews)
        const reviewsMap = new Map();

        results.forEach(row => {
            if (!reviewsMap.has(row.review_id)) {
                // Parse tags JSON if it exists
                let tags = [];
                try {
                    if (row.tags) {
                        tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
                    }
                } catch (e) {
                    console.error('Error parsing tags JSON:', e);
                }

                reviewsMap.set(row.review_id, {
                    id: row.review_id,
                    user_id: row.user_id,
                    username: row.username,
                    points: row.points,
                    rating: row.rating,
                    text: row.text,
                    tags: tags,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    business: {
                        id: row.business_id,
                        name: row.business_name,
                        division: row.division,
                        category: row.category,
                        address: row.address,
                        description: row.business_description
                    },
                    media: [],
                    likes: row.likes,
                    dislikes: row.dislikes
                });
            }

            if (row.media_id && row.media_url) {
                reviewsMap.get(row.review_id).media.push({
                    id: row.media_id,
                    url: row.media_url,
                    type: row.media_type
                });
            }
        });

        // Convert map → array
        const reviews = Array.from(reviewsMap.values());
        
        // Return results with search metadata
        res.json({
            query: q,
            results_count: reviews.length,
            reviews: reviews
        });
    });
});

// Get all reviews with business info (global)
router.get('/all', (req, res) => {
    const query = `
        SELECT r.id, r.user_id, r.rating, r.text, r.created_at, r.updated_at,
               b.name AS business_name, b.division, b.category, b.address,
               u.name AS username, u.points,
               (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 1) AS likes,
               0 AS dislikes
        FROM reviews r
        JOIN businesses b ON r.business_id = b.id
        JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            return res.status(500).json({ error: 'Error fetching reviews' });
        }
        res.json(results);
    });
});

// GET reviews by business ID
router.get('/business/:businessId', (req, res) => {
    const query = `
        SELECT r.id, r.user_id, r.rating, r.text, r.created_at, r.updated_at,
               b.name AS business_name, b.division, b.category, b.address,
               u.name AS username, u.points,
               (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 1) AS likes,
               0 AS dislikes
        FROM reviews r
        JOIN businesses b ON r.business_id = b.id
        JOIN users u ON r.user_id = u.id
        WHERE r.business_id = ?
        ORDER BY r.created_at DESC
    `;
    db.query(query, [req.params.businessId], (err, results) => {
        if (err) {
            console.error('Error fetching business reviews:', err);
            return res.status(500).json({ error: 'Error fetching business reviews' });
        }
        res.json(results);
    });
});

// GET all reviews for a specific business (with media inline)
router.get('/business/name/:businessName', (req, res) => {
    const { businessName } = req.params;

    const query = `
        SELECT 
            r.id AS review_id, r.user_id, r.rating, r.text, r.created_at, r.updated_at,
            b.name AS business_name, b.division, b.category, b.address,
            u.name AS username, u.points,
            m.id AS media_id, m.media_url, m.media_type,
            (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 1) AS likes,
            0 AS dislikes
        FROM reviews r
        JOIN businesses b ON r.business_id = b.id
        JOIN users u ON r.user_id = u.id
        LEFT JOIN media m ON r.business_id = m.business_id
        WHERE b.name = ?
        ORDER BY r.created_at DESC
    `;

    db.query(query, [businessName], (err, results) => {
        if (err) {
            console.error('Error fetching reviews for business:', err);
            return res.status(500).json({ error: 'Error fetching reviews for this business' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this business' });
        }

        // 🧠 Group media by review (same structure as global /reviews)
        const reviewsMap = new Map();

        results.forEach(row => {
            if (!reviewsMap.has(row.review_id)) {
                reviewsMap.set(row.review_id, {
                    id: row.review_id,
                    user_id: row.user_id,
                    username: row.username,
                    points: row.points,
                    rating: row.rating,
                    text: row.text,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    business: {
                        name: row.business_name,
                        division: row.division,
                        category: row.category,
                        address: row.address
                    },
                    media: [],
                    likes: row.likes,
                    dislikes: row.dislikes
                });
            }

            if (row.media_id && row.media_url) {
                reviewsMap.get(row.review_id).media.push({
                    id: row.media_id,
                    url: row.media_url,
                    type: row.media_type
                });
            }
        });

        const reviews = Array.from(reviewsMap.values());
        res.json(reviews);
    });
});

// GET a single review by ID (with media inline)
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT 
            r.id AS review_id, r.user_id, r.rating, r.text, r.created_at, r.updated_at,
            b.name AS business_name, b.division, b.category, b.address,
            u.name AS username, u.points,
            m.id AS media_id, m.media_url, m.media_type,
            (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 1) AS likes,
            0 AS dislikes
        FROM reviews r
        JOIN businesses b ON r.business_id = b.id
        JOIN users u ON r.user_id = u.id
        LEFT JOIN media m ON r.business_id = m.business_id
        WHERE r.id = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching review:', err);
            return res.status(500).json({ error: 'Error fetching review' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const row = results[0];

        // Build review object
        const review = {
            id: row.review_id,
            user_id: row.user_id,
            username: row.username,
            points: row.points,
            rating: row.rating,
            text: row.text,
            created_at: row.created_at,
            updated_at: row.updated_at,
            business: {
                name: row.business_name,
                division: row.division,
                category: row.category,
                address: row.address
            },
            media: [],
            likes: row.likes,
            dislikes: row.dislikes
        };

        // Add all media
        results.forEach(r => {
            if (r.media_id && r.media_url) {
                review.media.push({
                    id: r.media_id,
                    url: r.media_url,
                    type: r.media_type
                });
            }
        });

        res.json(review);
    });
});

// POST a new review with subscription, business, media, points logic
router.post('/', authenticateJWT, upload.array('media', 4), (req, res) => {
    // Use req.user.id from JWT, not from body
    const user_id = req.user.id;
    const {
        business_name,
        division,
        category,
        address,
        text,
        rating,
        tags,
        description,
        location,
        contact,
        latitude,  // From Google Places
        longitude, // From Google Places
        place_id   // From Google Places (for future use)
    } = req.body;
    const mediaFiles = Array.isArray(req.files) ? req.files : [];

    // Debug logging
    console.log('📝 Review submission received:');
    console.log('  - business_name:', business_name);
    console.log('  - user_id:', user_id);
    console.log('  - address:', address);

    if (!user_id) {
        console.error('❌ Validation failed: user_id missing (not logged in?)');
        return res.status(401).json({ error: 'You must be logged in to submit a review' });
    }

    if (!business_name) {
        console.error('❌ Validation failed: business_name missing');
        return res.status(400).json({ error: 'Business name is required' });
    }

    // STEP 1: Check subscription uploads remaining
    const subQuery = 'SELECT id, uploads_remaining FROM subscriptions WHERE user_id = ? AND expiry_date > NOW()';
    db.query(subQuery, [user_id], (err, subs) => {
        if (err) {
            console.error('Subscription check error:', err);
            return res.status(500).json({ error: 'Database error checking subscription' });
        }

        if (subs.length === 0 || subs[0].uploads_remaining <= 0) {
            return res.status(403).json({ error: 'No uploads left. Please renew your subscription.' });
        }

        // STEP 2: Check if business exists (by name, or by name and address if address is provided)
        // If we have a place_id in the future, we can check by that first
        let businessQuery;
        let queryParams;
        
        if (address && address.trim() !== '') {
            // Check by name AND address for better uniqueness
            businessQuery = 'SELECT id FROM businesses WHERE name = ? AND address = ? LIMIT 1';
            queryParams = [business_name, address];
        } else {
            // If no address, just check by name (less precise but works)
            businessQuery = 'SELECT id FROM businesses WHERE name = ? LIMIT 1';
            queryParams = [business_name];
        }
        
        db.query(businessQuery, queryParams, (err, businessResult) => {
            if (err) {
                console.error('Business check error:', err);
                return res.status(500).json({ error: 'Database error checking business' });
            }

            let businessId;
            if (businessResult.length > 0) {
                businessId = businessResult[0].id;
                
                // 🎮 ANTI-GAMING: Check if user already reviewed this business in last 7 days
                const recentReviewCheck = `
                    SELECT id, created_at FROM reviews 
                    WHERE user_id = ? AND business_id = ? 
                    AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
                `;
                db.query(recentReviewCheck, [user_id, businessId], (err, recentReviews) => {
                    if (err) {
                        console.error('Recent review check error:', err);
                        return res.status(500).json({ error: 'Database error' });
                    }

                    if (recentReviews.length > 0) {
                        return res.status(429).json({ 
                            error: 'You can only review this business once every 7 days',
                            lastReview: recentReviews[0].created_at
                        });
                    }

                    insertReview();
                });
            } else {
                // Insert new business if it doesn't exist
                // 🗺️ Step 2a: Use coordinates from Google Places if provided, otherwise geocode
                const hasCoordinates = latitude && longitude && !isNaN(latitude) && !isNaN(longitude);
                
                if (hasCoordinates) {
                    // Use coordinates directly from Google Places (more accurate)
                    console.log(`📍 Using Google Places coordinates: ${latitude}, ${longitude}`);
                    const insertBusiness = `
                        INSERT INTO businesses (name, category, description, location, division, address, contact, latitude, longitude) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    db.query(
                        insertBusiness,
                        [
                            business_name,
                            category || null,
                            description || null,
                            location || null,
                            division || null,
                            address || null,
                            contact || null,
                            parseFloat(latitude),
                            parseFloat(longitude)
                        ],
                        (err, result) => {
                            if (err) {
                                console.error('Insert business error:', err);
                                return res.status(500).json({ error: 'Error adding business' });
                            }
                            businessId = result.insertId;
                            console.log(`✅ Business created with GPS coordinates from Google Places`);
                            insertReview();
                        }
                    );
                } else {
                    // Fallback to geocoding if coordinates not provided
                    const fullAddress = `${business_name}, ${address || ''}, ${location || ''}, ${division || ''}`.trim();
                    console.log(`🗺️ Geocoding address: ${fullAddress}`);
                    
                    getCoordinatesFromAddress(fullAddress).then(coords => {
                        const insertBusiness = `
                            INSERT INTO businesses (name, category, description, location, division, address, contact, latitude, longitude) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;
                        
                        db.query(
                            insertBusiness,
                            [
                                business_name,
                                category || null,
                                description || null,
                                location || null,
                                division || null,
                                address || null,
                                contact || null,
                                coords?.latitude || null,
                                coords?.longitude || null
                            ],
                            (err, result) => {
                                if (err) {
                                    console.error('Insert business error:', err);
                                    return res.status(500).json({ error: 'Error adding business' });
                                }
                                businessId = result.insertId;
                                
                                if (coords) {
                                    console.log(`📍 Business coordinates saved via geocoding: ${coords.latitude}, ${coords.longitude}`);
                                } else {
                                    console.log('⚠️ Could not geocode address - GPS check-in will not work for this business');
                                }
                                
                                insertReview();
                            }
                        );
                    }).catch(err => {
                        console.error('Geocoding error:', err);
                        // Continue anyway without coordinates
                        const insertBusiness = `
                            INSERT INTO businesses (name, category, description, location, division, address, contact) 
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `;
                        db.query(
                            insertBusiness,
                            [
                                business_name,
                                category || null,
                                description || null,
                                location || null,
                                division || null,
                                address || null,
                                contact || null
                            ],
                            (err, result) => {
                                if (err) {
                                    console.error('Insert business error:', err);
                                    return res.status(500).json({ error: 'Error adding business' });
                                }
                                businessId = result.insertId;
                                console.log('⚠️ Business created without GPS coordinates');
                                insertReview();
                            }
                        );
                    });
                }
            }

            // STEP 3: Insert review
            function insertReview() {
                const reviewQuery = `
                    INSERT INTO reviews (user_id, business_id, rating, text, tags) 
                    VALUES (?, ?, ?, ?, ?)
                `;
                db.query(
                    reviewQuery,
                    [user_id, businessId, rating || null, text, JSON.stringify(tags || [])],
                    (err, reviewResult) => {
                        if (err) {
                            console.error('Review insert error:', err);
                            return res.status(500).json({ error: 'Error saving review' });
                        }

                        const reviewId = reviewResult.insertId;

                        // STEP 4: Handle media upload if exists (up to 4 files, image/video)
                        if (mediaFiles.length > 0) {
                            const mediaQuery = `
                                INSERT INTO media (business_id, media_url, media_type)
                                VALUES (?, ?, ?)
                            `;
                            mediaFiles.forEach((file) => {
                                const inferredType = file.mimetype && file.mimetype.startsWith('video') ? 'video' : 'image';
                                db.query(mediaQuery, [businessId, file.filename, inferredType], (err) => {
                                    if (err) console.error('Media insert error:', err);
                                });
                            });
                        }

                        // STEP 5: Points calculation
                        let pointsToAdd = 10; // Base review points
                        if (mediaFiles.length > 0) pointsToAdd += 5; // Media bonus (flat)

                        // Check if this is the first review for the business
                        const firstReviewQuery = 'SELECT COUNT(*) AS count FROM reviews WHERE business_id = ?';
                        db.query(firstReviewQuery, [businessId], (err, countResult) => {
                            if (!err && countResult[0].count === 1) {
                                pointsToAdd *= 2; // double if first review
                            }

                            // 🎮 Use gamification system with daily cap
                            awardPoints(user_id, pointsToAdd, (err, actualPointsAwarded) => {
                                if (err) console.error('Points award error:', err);

                                // STEP 6: Check for achievements
                                checkMilestones(user_id, (err, newAchievements) => {
                                    if (err) console.error('Milestone check error:', err);

                                    // STEP 7: Decrement uploads from subscription
                                    const updateSubs = 'UPDATE subscriptions SET uploads_remaining = uploads_remaining - 1 WHERE id = ?';
                                    db.query(updateSubs, [subs[0].id], (err) => {
                                        if (err) console.error('Subscription update error:', err);
                                    });

                                    res.json({ 
                                        message: 'Review submitted successfully', 
                                        review_id: reviewId, 
                                        points_awarded: actualPointsAwarded,
                                        new_achievements: newAchievements || []
                                    });
                                });
                            });
                        });
                    }
                );
            }
        });
    });
});

// React to a review (like/dislike) with author points adjustment
router.post('/:id/react', authenticateJWT, (req, res) => {
    const reviewId = req.params.id;
    const user_id = req.user.id; // Get from JWT token
    const { reaction } = req.body;

    if (!['like', 'none'].includes(reaction)) {
        return res.status(400).json({ error: 'Invalid reaction. Must be: like or none' });
    }

    // Step 1: Get review author
    db.query('SELECT user_id FROM reviews WHERE id = ?', [reviewId], (err, reviews) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }

        if (reviews.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const authorId = reviews[0].user_id;

        // 🎮 ANTI-GAMING: Prevent self-likes
        if (authorId === user_id) {
            return res.status(403).json({ error: 'You cannot react to your own review' });
        }

        // Step 2: Check existing reaction
        const checkQuery = 'SELECT is_like FROM review_likes WHERE user_id = ? AND review_id = ?';
        db.query(checkQuery, [user_id, reviewId], (err2, existingReaction) => {
            if (err2) {
                return res.status(500).json({ error: 'Database error' });
            }

            const hadReaction = existingReaction.length > 0;
            const previousIsLike = hadReaction ? existingReaction[0].is_like : null;

            // Step 3: Calculate point changes for author
            let pointsChange = 0;

            if (reaction === 'none') {
                if (previousIsLike === 1) {
                    pointsChange = -2; // remove like bonus
                }
            } else {
                // reaction === 'like'
                if (!hadReaction) {
                    pointsChange = 2; // new like
                } else if (previousIsLike !== 1) {
                    // if table ever had other values, normalize to like
                    pointsChange = 2;
                }
            }

            // Step 4: Update or delete reaction
            if (reaction === 'none') {
                // Delete reaction
                db.query('DELETE FROM review_likes WHERE user_id = ? AND review_id = ?', 
                    [user_id, reviewId], (err3) => {
                        if (err3) {
                            return res.status(500).json({ error: 'Failed to remove reaction' });
                        }

                        // Apply points change
                        applyPointsChange(authorId, pointsChange, res);
                    });
            } else {
                // Insert or update reaction
                const newIsLike = 1;
                const upsertQuery = `
                    INSERT INTO review_likes (user_id, review_id, is_like)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE is_like = VALUES(is_like)
                `;

                db.query(upsertQuery, [user_id, reviewId, newIsLike], (err4) => {
                    if (err4) {
                        return res.status(500).json({ error: 'Database error', details: err4.message });
                    }

                    // Apply points change
                    applyPointsChange(authorId, pointsChange, res);
                });
            }

            function applyPointsChange(authorId, points, res) {
                if (points === 0) {
                    return res.json({ message: 'Reaction updated', points_change: 0 });
                }

                if (points > 0) {
                    awardPoints(authorId, points, (err5, actualPoints) => {
                        if (err5) console.error('Points award error:', err5);
                        res.json({ 
                            message: 'Reaction recorded', 
                            points_change: actualPoints 
                        });
                    });
                } else {
                    deductPoints(authorId, Math.abs(points), (err6) => {
                        if (err6) console.error('Points deduct error:', err6);
                        res.json({ 
                            message: 'Reaction recorded', 
                            points_change: points 
                        });
                    });
                }
            }
        });
    });
});

// Get reactions (likes/dislikes) for a review
router.get('/:id/reactions', (req, res) => {
    const reviewId = req.params.id;

    const likesQuery = `
        SELECT COUNT(*) as likes FROM review_likes
        WHERE review_id = ? AND is_like = 1
    `;

    db.query(likesQuery, [reviewId], (err, likesResult) => {
        if (err) return res.status(500).json({ error: 'Server error.' });

        res.json({
            likes: likesResult[0].likes,
            dislikes: 0
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

// GET all reviews with business + media info (returns media as array)
router.get('/', (req, res) => {
    const query = `
        SELECT 
            r.id AS review_id, r.user_id, r.rating, r.text, r.created_at, r.updated_at,
            b.name AS business_name, b.division, b.category, b.address,
            u.name AS username, u.points,
            m.id AS media_id, m.media_url, m.media_type,
            (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 1) AS likes,
            (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 0) AS dislikes
        FROM reviews r
        JOIN businesses b ON r.business_id = b.id
        JOIN users u ON r.user_id = u.id
        LEFT JOIN media m ON r.business_id = m.business_id
        ORDER BY r.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching all reviews:', err);
            return res.status(500).json({ error: 'Error fetching all reviews' });
        }

        // 🧠 Rebuild response to group media by review
        const reviewsMap = new Map();

        results.forEach(row => {
            if (!reviewsMap.has(row.review_id)) {
                reviewsMap.set(row.review_id, {
                    id: row.review_id,
                    user_id: row.user_id,
                    username: row.username,
                    points: row.points,
                    rating: row.rating,
                    text: row.text,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    business: {
                        name: row.business_name,
                        division: row.division,
                        category: row.category,
                        address: row.address
                    },
                    media: [],
                    likes: row.likes,
                    dislikes: row.dislikes
                });
            }

            if (row.media_id && row.media_url) {
                reviewsMap.get(row.review_id).media.push({
                    id: row.media_id,
                    url: row.media_url,
                    type: row.media_type
                });
            }
        });

        // Convert map → array
        const reviews = Array.from(reviewsMap.values());
        res.json(reviews);
    });
});

// Get all reviews with business info (global)
router.get('/all', (req, res) => {
    const query = `
        SELECT r.id, r.user_id, r.rating, r.text, r.created_at, r.updated_at,
               b.name AS business_name, b.division, b.category, b.address,
               u.name AS username, u.points,
               (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 1) AS likes,
               (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 0) AS dislikes
        FROM reviews r
        JOIN businesses b ON r.business_id = b.id
        JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            return res.status(500).json({ error: 'Error fetching reviews' });
        }
        res.json(results);
    });
});

// GET reviews by business ID
router.get('/business/:businessId', (req, res) => {
    const query = `
        SELECT r.id, r.user_id, r.rating, r.text, r.created_at, r.updated_at,
               b.name AS business_name, b.division, b.category, b.address,
               u.name AS username, u.points,
               (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 1) AS likes,
               (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 0) AS dislikes
        FROM reviews r
        JOIN businesses b ON r.business_id = b.id
        JOIN users u ON r.user_id = u.id
        WHERE r.business_id = ?
        ORDER BY r.created_at DESC
    `;
    db.query(query, [req.params.businessId], (err, results) => {
        if (err) {
            console.error('Error fetching business reviews:', err);
            return res.status(500).json({ error: 'Error fetching business reviews' });
        }
        res.json(results);
    });
});

// GET all reviews for a specific business (with media inline)
router.get('/business/name/:businessName', (req, res) => {
    const { businessName } = req.params;

    const query = `
        SELECT 
            r.id AS review_id, r.user_id, r.rating, r.text, r.created_at, r.updated_at,
            b.name AS business_name, b.division, b.category, b.address,
            u.name AS username, u.points,
            m.id AS media_id, m.media_url, m.media_type,
            (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 1) AS likes,
            (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND is_like = 0) AS dislikes
        FROM reviews r
        JOIN businesses b ON r.business_id = b.id
        JOIN users u ON r.user_id = u.id
        LEFT JOIN media m ON r.business_id = m.business_id
        WHERE b.name = ?
        ORDER BY r.created_at DESC
    `;

    db.query(query, [businessName], (err, results) => {
        if (err) {
            console.error('Error fetching reviews for business:', err);
            return res.status(500).json({ error: 'Error fetching reviews for this business' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this business' });
        }

        // 🧠 Group media by review (same structure as global /reviews)
        const reviewsMap = new Map();

        results.forEach(row => {
            if (!reviewsMap.has(row.review_id)) {
                reviewsMap.set(row.review_id, {
                    id: row.review_id,
                    user_id: row.user_id,
                    username: row.username,
                    points: row.points,
                    rating: row.rating,
                    text: row.text,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    business: {
                        name: row.business_name,
                        division: row.division,
                        category: row.category,
                        address: row.address
                    },
                    media: [],
                    likes: row.likes,
                    dislikes: row.dislikes
                });
            }

            if (row.media_id && row.media_url) {
                reviewsMap.get(row.review_id).media.push({
                    id: row.media_id,
                    url: row.media_url,
                    type: row.media_type
                });
            }
        });

        const reviews = Array.from(reviewsMap.values());
        res.json(reviews);
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

// DELETE a review by ID (admin only)
router.delete('/reported/:id', authenticateJWT, authorizeRole(['admin']), (req, res) => {
    const reviewId = req.params.id;

    const deleteQuery = 'DELETE FROM reviews WHERE id = ?';
    db.query(deleteQuery, [reviewId], (err, result) => {
        if (err) {
            console.error('Error deleting review:', err);
            return res.status(500).json({ error: 'Server error.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Review not found.' });
        }

        res.json({ message: 'Review deleted successfully.' });
    });
});

module.exports = router;