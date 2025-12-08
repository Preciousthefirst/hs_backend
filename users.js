const express = require('express');
const router = express.Router();
const db = require('../db.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken=require('../middleware/authenticateJWT.js');
const authorizeRole=require('../middleware/authorizeRole.js');
require('dotenv').config(); // Load the .env file


const SECRET_KEY = process.env.JWT_SECRET; // Fetch the JWT_SECRET from the environment
console.log('JWT_SECRET:', SECRET_KEY);

// Get all users
router.get('/', verifyToken, authorizeRole('admin'), (req, res) => {
    const query = 'SELECT * FROM users';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Register a new user
router.post('/', async (req, res) => {
    console.log('POST /users hit');
    console.log('Request body:', req.body);

    const { name, email, password, role } = req.body;

    try {
        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
        db.query(query, [name, email, hashedPassword, role || 'user'], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
        });

    } catch (error) {
        res.status(500).json({ error: 'Error hashing password' });
    }
});

// Login Route
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    try{
    
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            SECRET_KEY,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        res.json({ message: 'Login successful', token });
    });
} catch (error) {
    console.error('Error in /login route:', error);
    res.status(500).json({ error: 'Something went wrong' });
}
});

// Delete a user
router.delete('/:id', verifyToken, authorizeRole('admin'), (req, res) => {
    const userId = req.params.id;

    // First, delete associated reviews
    const deleteReviewsQuery = 'DELETE FROM reviews WHERE user_id = ?';
    db.query(deleteReviewsQuery, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Then, delete the user
        const deleteUserQuery = 'DELETE FROM users WHERE id = ?';
        db.query(deleteUserQuery, [userId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'User and associated reviews deleted successfully' });
        });
    });
});

//users updating details, admin and roles and the like.
router.put('/:id', verifyToken, (req, res) => {
    const { name, email, role, password } = req.body;
    const userId = req.params.id;

    let updateQuery = 'UPDATE users SET ';
    const updateFields = [];
    const updateValues = [];

    if (name) {
        updateFields.push('name = ?');
        updateValues.push(name);
    }
    if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
    }
    if (role) {
        updateFields.push('role = ?');
        updateValues.push(role);
    }
    if (password) {
        updateFields.push('password = ?');
        updateValues.push(bcrypt.hashSync(password, 10));
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    updateQuery += updateFields.join(', ') + ' WHERE id = ?';
    updateValues.push(userId);

    db.query(updateQuery, updateValues, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'User updated successfully' });
    });
});


// Middleware to verify JWT
/*const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.user = decoded;
        next();
    });
};*/

// Example of a protected route
router.get('/profile', verifyToken, (req, res) => {
    res.json({ message: 'Profile access granted', user: req.user });
});

module.exports = router;
