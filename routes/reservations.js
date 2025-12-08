const express = require('express');
const router = express.Router();
const { Reservation, Business, User } = require('../db.js');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');
const { awardPoints } = require('../utils/gamification');

// POST /reservations - create a reservation (auth required)
router.post('/', authenticateJWT, async (req, res) => {
    const userId = req.user.id;
    const { business_id, date, time, people, special_requests } = req.body;

    if (!business_id || !date || !time || !people) {
        return res.status(400).json({ error: 'business_id, date, time, and people are required' });
    }

    try {
        const reservation = new Reservation({
            user_id: userId,
            business_id,
            date: new Date(date),
            time,
            people,
            special_requests: special_requests || null,
            status: 'pending'
        });

        const savedReservation = await reservation.save();
        res.status(201).json({ 
            id: savedReservation._id.toString(), 
            message: 'Reservation request submitted' 
        });
    } catch (err) {
        console.error('Create reservation error:', err);
        res.status(500).json({ error: 'Failed to create reservation' });
    }
});

// GET /reservations/user/:userId - list reservations for a user (self or admin)
router.get('/user/:userId', authenticateJWT, async (req, res) => {
    const requestedUserId = req.params.userId;
    const requester = req.user;

    if (requester.role !== 'admin' && requester.id !== requestedUserId) {
        return res.status(403).json({ error: 'Not authorized to view these reservations' });
    }

    try {
        const reservations = await Reservation.find({ user_id: requestedUserId })
            .populate('business_id', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const formattedReservations = reservations.map(r => ({
            id: r._id.toString(),
            user_id: r.user_id.toString(),
            business_id: r.business_id._id.toString(),
            business_name: r.business_id.name,
            date: r.date,
            time: r.time,
            people: r.people,
            special_requests: r.special_requests,
            status: r.status,
            created_at: r.createdAt,
            updated_at: r.updatedAt
        }));

        res.json(formattedReservations);
    } catch (err) {
        console.error('Fetch user reservations error:', err);
        res.status(500).json({ error: 'Failed to fetch reservations' });
    }
});

// GET /reservations/business/:businessId - list reservations for a business (admin only for now)
router.get('/business/:businessId', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    const businessId = req.params.businessId;

    try {
        const reservations = await Reservation.find({ business_id: businessId })
            .populate('user_id', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        const formattedReservations = reservations.map(r => ({
            id: r._id.toString(),
            user_id: r.user_id._id.toString(),
            user_name: r.user_id.name,
            user_email: r.user_id.email,
            business_id: r.business_id.toString(),
            date: r.date,
            time: r.time,
            people: r.people,
            special_requests: r.special_requests,
            status: r.status,
            created_at: r.createdAt,
            updated_at: r.updatedAt
        }));

        res.json(formattedReservations);
    } catch (err) {
        console.error('Fetch business reservations error:', err);
        res.status(500).json({ error: 'Failed to fetch reservations' });
    }
});

// PUT /reservations/:id/status - update reservation status (admin only for now)
router.put('/:id/status', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    const reservationId = req.params.id;
    const { status } = req.body;

    const allowed = ['pending', 'confirmed', 'rejected', 'completed', 'no-show'];
    if (!allowed.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
    }

    try {
        const reservation = await Reservation.findById(reservationId);

        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        const userId = reservation.user_id.toString();
        reservation.status = status;
        await reservation.save();

        if (status === 'completed') {
            // award completion points
            awardPoints(userId, 15, (e) => {
                if (e) console.error('Award points on reservation completion error:', e);
            });
        }

        res.json({ message: 'Reservation status updated', status });
    } catch (err) {
        console.error('Update reservation status error:', err);
        res.status(500).json({ error: 'Failed to update reservation' });
    }
});

// GET /reservations/confirm/:token - optional one-click confirm
router.get('/confirm/:token', async (req, res) => {
    const token = req.params.token;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    try {
        const reservation = await Reservation.findOne({ confirmation_token: token });

        if (!reservation) {
            return res.status(404).json({ error: 'Invalid or expired token' });
        }

        reservation.status = 'confirmed';
        await reservation.save();

        res.json({ message: 'Reservation confirmed' });
    } catch (err) {
        console.error('Confirm reservation error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
