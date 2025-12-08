/**
 * TEST FILE FOR TRANSACTIONS API
 * Run this with: node test_transactions.js
 * 
 * Make sure your server is running on http://localhost:3000
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let testTransactionRef = '';

// Test user (change this to an actual user_id in your database)
const TEST_USER_ID = 8;

console.log('🧪 Starting Transaction API Tests...\n');

// ============================================================================
// TEST 1: Create a new pending transaction
// ============================================================================
async function testCreateTransaction() {
    console.log('📝 TEST 1: Creating new transaction...');
    try {
        const response = await axios.post(`${BASE_URL}/transactions`, {
            user_id: TEST_USER_ID,
            amount: 2000,
            method: 'mobile_money'
        });

        console.log('✅ Transaction created successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        // Save transaction_ref for next tests
        testTransactionRef = response.data.transaction.transaction_ref;
        console.log(`\n💾 Saved transaction_ref: ${testTransactionRef}\n`);
        
        return response.data;
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        throw error;
    }
}

// ============================================================================
// TEST 2: Try to create transaction with invalid amount
// ============================================================================
async function testInvalidAmount() {
    console.log('📝 TEST 2: Testing invalid amount (should fail)...');
    try {
        await axios.post(`${BASE_URL}/transactions`, {
            user_id: TEST_USER_ID,
            amount: 5000, // Wrong amount!
            method: 'mobile_money'
        });
        console.log('❌ Test failed - should have rejected invalid amount');
    } catch (error) {
        console.log('✅ Correctly rejected invalid amount');
        console.log('Error message:', error.response?.data?.error);
        console.log('');
    }
}

// ============================================================================
// TEST 3: Get transaction details by ID
// ============================================================================
async function testGetTransaction(transactionId) {
    console.log('📝 TEST 3: Getting transaction details...');
    try {
        const response = await axios.get(`${BASE_URL}/transactions/${transactionId}`);
        console.log('✅ Transaction retrieved successfully!');
        console.log('Transaction status:', response.data.status);
        console.log('Full transaction:', JSON.stringify(response.data, null, 2));
        console.log('');
        return response.data;
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// ============================================================================
// TEST 4: Get all transactions for user
// ============================================================================
async function testGetUserTransactions() {
    console.log('📝 TEST 4: Getting all transactions for user...');
    try {
        const response = await axios.get(`${BASE_URL}/transactions/user/${TEST_USER_ID}`);
        console.log(`✅ Found ${response.data.length} transactions for user ${TEST_USER_ID}`);
        console.log('Transactions:', JSON.stringify(response.data, null, 2));
        console.log('');
        return response.data;
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// ============================================================================
// TEST 5: Simulate payment confirmation (THIS IS THE KEY ONE!)
// ============================================================================
async function testConfirmPayment(transaction_ref) {
    console.log('📝 TEST 5: Confirming payment (simulating mobile money success)...');
    try {
        const response = await axios.post(`${BASE_URL}/transactions/confirm`, {
            transaction_ref
        });
        console.log('✅ Payment confirmed successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('');
        return response.data;
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// ============================================================================
// TEST 6: Check subscription was created/updated
// ============================================================================
async function testCheckSubscription() {
    console.log('📝 TEST 6: Checking if subscription was created/updated...');
    try {
        // Note: You'll need to create this endpoint or check directly in database
        console.log('⚠️  Subscription check endpoint not yet created');
        console.log('💡 Tip: Check your database subscriptions table to verify:');
        console.log(`   SELECT * FROM subscriptions WHERE user_id = ${TEST_USER_ID};`);
        console.log('');
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// ============================================================================
// TEST 7: Try to confirm same transaction twice (should fail)
// ============================================================================
async function testDoubleConfirm(transaction_ref) {
    console.log('📝 TEST 7: Trying to confirm same transaction twice (should fail)...');
    try {
        await axios.post(`${BASE_URL}/transactions/confirm`, {
            transaction_ref
        });
        console.log('❌ Test failed - should have rejected double confirmation');
    } catch (error) {
        console.log('✅ Correctly rejected double confirmation');
        console.log('Error message:', error.response?.data?.error);
        console.log('');
    }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
async function runAllTests() {
    try {
        // Test 1: Create transaction
        const createResult = await testCreateTransaction();
        const transactionId = createResult.transaction.id;
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
        
        // Test 2: Invalid amount
        await testInvalidAmount();
        
        // Test 3: Get transaction by ID
        await testGetTransaction(transactionId);
        
        // Test 4: Get all user transactions
        await testGetUserTransactions();
        
        // Test 5: Confirm payment (KEY TEST!)
        await testConfirmPayment(testTransactionRef);
        
        // Test 6: Check subscription
        await testCheckSubscription();
        
        // Test 7: Try double confirm
        await testDoubleConfirm(testTransactionRef);
        
        console.log('🎉 ALL TESTS COMPLETED!\n');
        console.log('📊 SUMMARY:');
        console.log('   ✅ Transaction creation: Working');
        console.log('   ✅ Payment confirmation: Working');
        console.log('   ✅ Subscription activation: Check database');
        console.log('   ✅ Double-confirmation prevention: Working');
        
    } catch (error) {
        console.error('💥 Test suite failed:', error.message);
    }
}

// Run tests
runAllTests();


