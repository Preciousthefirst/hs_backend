# 📡 Complete API Documentation

## 🔐 Authentication
Most endpoints require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 💳 TRANSACTIONS API

### 1. Create Transaction (Pending Payment)
**Endpoint**: `POST /transactions`  
**Auth**: Not required  
**Body**:
```json
{
  "user_id": 8,
  "amount": 2000,
  "method": "mobile_money"
}
```
**Response**:
```json
{
  "message": "Transaction created successfully",
  "transaction": {
    "id": 1,
    "user_id": 8,
    "amount": 2000,
    "method": "mobile_money",
    "status": "pending",
    "transaction_type": "subscription",
    "transaction_ref": "TXN-1729567890123-A1B2C3D4"
  }
}
```

---

### 2. Confirm Payment (Activate Subscription)
**Endpoint**: `POST /transactions/confirm`  
**Auth**: Not required (called by payment provider or frontend)  
**Body**:
```json
{
  "transaction_ref": "TXN-1729567890123-A1B2C3D4"
}
```
**Response**:
```json
{
  "message": "Payment confirmed! Subscription updated successfully",
  "uploads_added": 5,
  "transaction_ref": "TXN-1729567890123-A1B2C3D4"
}
```

---

### 3. Get Transaction by ID
**Endpoint**: `GET /transactions/:id`  
**Auth**: Not required  
**Response**:
```json
{
  "id": 1,
  "user_id": 8,
  "amount": 2000,
  "method": "mobile_money",
  "status": "completed",
  "transaction_type": "subscription",
  "transaction_ref": "TXN-1729567890123-A1B2C3D4",
  "created_at": "2025-10-21T10:30:00.000Z",
  "updated_at": "2025-10-21T10:35:00.000Z"
}
```

---

### 4. Get User's Transactions
**Endpoint**: `GET /transactions/user/:userId`  
**Auth**: Not required  
**Response**:
```json
[
  {
    "id": 3,
    "user_id": 8,
    "amount": 2000,
    "method": "mobile_money",
    "status": "completed",
    "transaction_type": "subscription",
    "transaction_ref": "TXN-1729567890-ABC123",
    "created_at": "2025-10-21T10:30:00.000Z",
    "updated_at": "2025-10-21T10:35:00.000Z"
  },
  {
    "id": 2,
    "user_id": 8,
    "amount": 2000,
    "method": "mobile_money",
    "status": "pending",
    "transaction_type": "subscription",
    "transaction_ref": "TXN-1729567000-DEF456",
    "created_at": "2025-10-15T08:20:00.000Z",
    "updated_at": "2025-10-15T08:20:00.000Z"
  }
]
```

---

## 📦 SUBSCRIPTIONS API

### 1. Get User's Current Subscription
**Endpoint**: `GET /subscriptions/user/:userId`  
**Auth**: Not required  
**Response**:
```json
{
  "id": 5,
  "user_id": 8,
  "uploads_remaining": 3,
  "start_date": "2025-10-21T10:35:00.000Z",
  "expiry_date": "2025-11-21T10:35:00.000Z",
  "status": "active"
}
```
**Error** (No subscription):
```json
{
  "error": "No subscription found",
  "message": "User has no active subscription"
}
```

---

### 2. Check Subscription Status
**Endpoint**: `GET /subscriptions/:userId/status`  
**Auth**: Not required  
**Response** (Active):
```json
{
  "status": "active",
  "uploads_remaining": 3,
  "expiry_date": "2025-11-21T10:35:00.000Z",
  "can_upload": true,
  "message": "Subscription is active"
}
```
**Response** (Expired):
```json
{
  "status": "expired",
  "uploads_remaining": 0,
  "expiry_date": "2025-09-21T10:35:00.000Z",
  "can_upload": false,
  "message": "Subscription has expired"
}
```
**Response** (No uploads):
```json
{
  "status": "depleted",
  "uploads_remaining": 0,
  "expiry_date": "2025-11-21T10:35:00.000Z",
  "can_upload": false,
  "message": "No uploads remaining"
}
```

---

### 3. Get All Subscriptions (Admin)
**Endpoint**: `GET /subscriptions`  
**Auth**: Required (JWT)  
**Response**:
```json
[
  {
    "id": 5,
    "user_id": 8,
    "uploads_remaining": 3,
    "start_date": "2025-10-21T10:35:00.000Z",
    "expiry_date": "2025-11-21T10:35:00.000Z",
    "username": "hinny",
    "email": "hinny@example.com",
    "status": "active"
  },
  {
    "id": 4,
    "user_id": 7,
    "uploads_remaining": 0,
    "start_date": "2025-09-01T08:00:00.000Z",
    "expiry_date": "2025-10-01T08:00:00.000Z",
    "username": "john",
    "email": "john@example.com",
    "status": "expired"
  }
]
```

---

## 📝 REVIEWS API (Already Exists)

### Get All Reviews
**Endpoint**: `GET /reviews`  
**Response**: Array of reviews with media, business, user info, likes/dislikes

### Get Review by ID
**Endpoint**: `GET /reviews/:id`  
**Response**: Single review with all details

### Get Reviews by Business
**Endpoint**: `GET /reviews/business/name/:businessName`  
**Response**: All reviews for specific business

### Create Review
**Endpoint**: `POST /reviews`  
**Auth**: Required (JWT)  
**Body**: FormData with business_name, rating, text, media, etc.

---

## 🔄 Complete Purchase Flow

### Step 1: User Clicks "Buy Subscription"
```javascript
// Frontend calls:
fetch('http://localhost:3000/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 8,
    amount: 2000,
    method: 'mobile_money'
  })
})
```

### Step 2: Show Transaction Reference
```
Transaction Reference: TXN-1729567890123-A1B2C3D4
Status: Pending
Please complete payment via mobile money
```

### Step 3: User Pays via Mobile Money
```
User dials *165# and enters:
- Amount: UGX 2000
- Reference: TXN-1729567890123-A1B2C3D4
```

### Step 4: Confirm Payment
```javascript
// Called by payment provider webhook OR frontend polling:
fetch('http://localhost:3000/transactions/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transaction_ref: 'TXN-1729567890123-A1B2C3D4'
  })
})
```

### Step 5: Check Subscription
```javascript
// Frontend fetches updated subscription:
fetch('http://localhost:3000/subscriptions/user/8')
// Returns: uploads_remaining: 5, status: 'active'
```

---

## 🧪 Testing

Run the test file:
```bash
node test_transactions.js
```

This will:
1. ✅ Create a pending transaction
2. ✅ Test invalid amount rejection
3. ✅ Get transaction details
4. ✅ Get user's transaction history
5. ✅ Confirm payment (simulate success)
6. ✅ Check subscription was created
7. ✅ Test double-confirmation prevention

---

## 📊 Database Tables Used

### `transactions`
- id, user_id, amount, method, status, transaction_type, transaction_ref, created_at, updated_at

### `subscriptions`
- id, user_id, uploads_remaining, start_date, expiry_date

---

## ✅ What's Complete

- ✅ Transaction creation (pending)
- ✅ Transaction confirmation
- ✅ Subscription activation
- ✅ Subscription status check
- ✅ Transaction history
- ✅ Duplicate prevention

## ⚠️ What's Missing

- ❌ Mobile money API integration (MTN/Airtel)
- ❌ Frontend dashboard
- ❌ Payment status polling
- ❌ Webhook handling from payment provider


