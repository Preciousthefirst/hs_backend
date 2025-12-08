const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure environment variables are loaded

const authenticateJWT = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1]; // Extracts token from "Bearer <token>"

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Unauthorized. Invalid token.' });
        }
        req.user = user; // Attach user payload to request
        next();
    });
};

module.exports = authenticateJWT;
