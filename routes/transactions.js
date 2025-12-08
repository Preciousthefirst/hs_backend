const express = require('express');
const router = express.Router();
const { Transaction, Subscription, User } = require('../db.js');
const crypto = require('crypto');
const authenticateJWT = require('../middleware/authenticateJWT');
const authorizeRole = require('../middleware/authorizeRole');

// ============================================================================
// 1️⃣ POST /transactions — Create New Transaction (Pending Payment)
// ============================================================================
router.post('/', async (req, res) => {
    const { user_id, amount, method } = req.body;

    // Validate required fields
    if (!user_id || !amount || !method) {
        return res.status(400).json({ error: "user_id, amount, and method are required" });
    }

    // Validate amount (subscription is UGX 2000)
    if (amount !== 2000) {
        return res.status(400).json({ error: "Invalid amount. Subscription is UGX 2000." });
    }

    try {
        // Generate unique transaction reference
        const transaction_ref = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // Insert transaction with status = 'pending'
        const transaction = new Transaction({
            user_id,
            amount,
            method,
            status: 'pending',
            transaction_type: 'subscription',
            transaction_ref
        });

        const savedTransaction = await transaction.save();

        // Return transaction details
        res.status(201).json({
            message: "Transaction created successfully",
            transaction: {
                id: savedTransaction._id.toString(),
                user_id: savedTransaction.user_id.toString(),
                amount: savedTransaction.amount,
                method: savedTransaction.method,
                status: savedTransaction.status,
                transaction_type: savedTransaction.transaction_type,
                transaction_ref: savedTransaction.transaction_ref
            }
        });
    } catch (err) {
        console.error('Transaction creation error:', err);
        res.status(500).json({ error: "Failed to create transaction" });
    }
});

// ============================================================================
// 2️⃣ POST /transactions/confirm — Confirm Payment & Activate Subscription
// ============================================================================
router.post('/confirm', async (req, res) => {
    const { transaction_ref } = req.body;

    if (!transaction_ref) {
        return res.status(400).json({ error: "transaction_ref is required" });
    }

    try {
        // Step 1: Find the transaction
        const transaction = await Transaction.findOne({ transaction_ref });

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        // Check if already completed
        if (transaction.status === 'completed') {
            return res.status(400).json({ error: "Transaction already completed" });
        }

        // Step 2: Update transaction status to 'completed'
        transaction.status = 'completed';
        await transaction.save();

        // Step 3: Check if user already has subscription
        const user_id = transaction.user_id;
        const existingSubscription = await Subscription.findOne({ user_id });

        if (existingSubscription) {
                // Update existing subscription → add 5 uploads, extend expiry
            const newExpiryDate = new Date();
            newExpiryDate.setDate(newExpiryDate.getDate() + 30);
            
            existingSubscription.uploads_remaining += 5;
            existingSubscription.expiry_date = newExpiryDate;
            await existingSubscription.save();

            res.json({ 
                message: "Payment confirmed! Subscription updated successfully", 
                uploads_added: 5,
                transaction_ref 
                });
            } else {
                // Create new subscription
            const newExpiryDate = new Date();
            newExpiryDate.setDate(newExpiryDate.getDate() + 30);

            const subscription = new Subscription({
                user_id,
                uploads_remaining: 5,
                start_date: new Date(),
                expiry_date: newExpiryDate
            });

            await subscription.save();

            res.json({ 
                message: "Payment confirmed! Subscription created successfully", 
                uploads_added: 5,
                transaction_ref 
            });
        }
    } catch (err) {
        console.error('Transaction confirmation error:', err);
        res.status(500).json({ error: "Failed to confirm transaction" });
    }
});

// ============================================================================
// 3️⃣ GET /transactions/:id — Get Transaction Details
// ============================================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        res.json({
            id: transaction._id.toString(),
            user_id: transaction.user_id.toString(),
            amount: transaction.amount,
            method: transaction.method,
            status: transaction.status,
            transaction_type: transaction.transaction_type,
            transaction_ref: transaction.transaction_ref,
            created_at: transaction.createdAt,
            updated_at: transaction.updatedAt
        });
    } catch (err) {
        console.error('Transaction lookup error:', err);
        res.status(500).json({ error: "Failed to fetch transaction" });
    }
});

// ============================================================================
// 4️⃣ GET /transactions/user/:userId — Get All Transactions for a User
// ============================================================================
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const transactions = await Transaction.find({ user_id: userId })
            .sort({ createdAt: -1 })
            .lean();

        const formattedTransactions = transactions.map(tx => ({
            id: tx._id.toString(),
            user_id: tx.user_id.toString(),
            amount: tx.amount,
            method: tx.method,
            status: tx.status,
            transaction_type: tx.transaction_type,
            transaction_ref: tx.transaction_ref,
            created_at: tx.createdAt,
            updated_at: tx.updatedAt
        }));

        res.json(formattedTransactions);
    } catch (err) {
        console.error('Transactions lookup error:', err);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

// ============================================================================
// 5️⃣ GET /transactions/admin/all — Get All Transactions (Admin Only)
// ============================================================================
router.get('/admin/all', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('user_id', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        const formattedTransactions = transactions.map(tx => ({
            id: tx._id.toString(),
            user_id: tx.user_id._id.toString(),
            username: tx.user_id.name,
            user_email: tx.user_id.email,
            amount: tx.amount,
            method: tx.method,
            status: tx.status,
            transaction_type: tx.transaction_type,
            transaction_ref: tx.transaction_ref,
            created_at: tx.createdAt,
            updated_at: tx.updatedAt
        }));

        res.json(formattedTransactions);
    } catch (err) {
        console.error('Admin transactions lookup error:', err);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

// ============================================================================
// 6️⃣ GET /transactions/admin/stats — Get Transaction Statistics (Admin Only)
// ============================================================================
router.get('/admin/stats', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const allTransactions = await Transaction.find().lean();

        const total_transactions = allTransactions.length;
        const completed_transactions = allTransactions.filter(t => t.status === 'completed').length;
        const pending_transactions = allTransactions.filter(t => t.status === 'pending').length;
        
        const total_revenue = allTransactions
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + t.amount, 0);

        const today_revenue = allTransactions
            .filter(t => t.status === 'completed' && new Date(t.createdAt) >= today)
            .reduce((sum, t) => sum + t.amount, 0);

        const week_revenue = allTransactions
            .filter(t => t.status === 'completed' && new Date(t.createdAt) >= weekAgo)
            .reduce((sum, t) => sum + t.amount, 0);

        const month_revenue = allTransactions
            .filter(t => t.status === 'completed' && new Date(t.createdAt) >= monthAgo)
            .reduce((sum, t) => sum + t.amount, 0);

        res.json({
            total_transactions,
            completed_transactions,
            pending_transactions,
            total_revenue,
            today_revenue,
            week_revenue,
            month_revenue
        });
    } catch (err) {
        console.error('Transaction stats error:', err);
        res.status(500).json({ error: "Failed to fetch transaction statistics" });
    }
});

module.exports = router;
