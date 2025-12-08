# 🧪 Manual Testing with cURL

Copy and paste these commands one by one to test your backend!

---

## ✅ Step 1: Check if user has a subscription

```bash
curl http://localhost:3000/subscriptions/user/8
```

**Expected**: Either subscription details or "No subscription found"

---

## ✅ Step 2: Create a new transaction (pending payment)

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 8,
    "amount": 2000,
    "method": "mobile_money"
  }'
```

**Expected Response**:
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

**📝 IMPORTANT**: Copy the `transaction_ref` from the response! You'll need it for the next step.

---

## ✅ Step 3: Confirm the payment (simulate mobile money success)

**Replace `YOUR_TRANSACTION_REF` with the actual transaction_ref from Step 2:**

```bash
curl -X POST http://localhost:3000/transactions/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_ref": "YOUR_TRANSACTION_REF"
  }'
```

**Example**:
```bash
curl -X POST http://localhost:3000/transactions/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_ref": "TXN-1729567890123-A1B2C3D4"
  }'
```

**Expected Response**:
```json
{
  "message": "Payment confirmed! Subscription updated successfully",
  "uploads_added": 5,
  "transaction_ref": "TXN-1729567890123-A1B2C3D4"
}
```

---

## ✅ Step 4: Check subscription again (should now show 5 uploads!)

```bash
curl http://localhost:3000/subscriptions/user/8
```

**Expected Response**:
```json
{
  "id": 1,
  "user_id": 8,
  "uploads_remaining": 5,
  "start_date": "2025-10-21T10:35:00.000Z",
  "expiry_date": "2025-11-21T10:35:00.000Z",
  "status": "active"
}
```

---

## ✅ Step 5: Check subscription status (detailed)

```bash
curl http://localhost:3000/subscriptions/8/status
```

**Expected Response**:
```json
{
  "status": "active",
  "uploads_remaining": 5,
  "expiry_date": "2025-11-21T10:35:00.000Z",
  "can_upload": true,
  "message": "Subscription is active"
}
```

---

## ✅ Step 6: Get all transactions for user

```bash
curl http://localhost:3000/transactions/user/8
```

**Expected**: Array of all transactions for user 8

---

## ✅ Step 7: Try to confirm the same transaction again (should fail!)

```bash
curl -X POST http://localhost:3000/transactions/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_ref": "YOUR_TRANSACTION_REF"
  }'
```

**Expected Response**:
```json
{
  "error": "Transaction already completed"
}
```

---

## ✅ Step 8: Test invalid amount (should fail!)

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 8,
    "amount": 5000,
    "method": "mobile_money"
  }'
```

**Expected Response**:
```json
{
  "error": "Invalid amount. Subscription is UGX 2000."
}
```

---

## 🎉 What This Tests

✅ Creating pending transactions  
✅ Payment confirmation  
✅ Subscription creation/update  
✅ Subscription status checking  
✅ Transaction history  
✅ Double-confirmation prevention  
✅ Amount validation  

---

## 🔄 Full Flow Summary

1. **User clicks "Buy Subscription"** → Creates pending transaction
2. **User pays via mobile money** → Mobile money provider processes
3. **Payment confirmed** → Backend updates transaction to 'completed' + adds uploads
4. **User can now upload** → Has 5 uploads remaining

---

## 💡 Tips

- Use `| jq` for pretty output: `curl http://localhost:3000/subscriptions/user/8 | jq`
- Save transaction_ref in a variable:
  ```bash
  TX_REF="TXN-1729567890123-A1B2C3D4"
  curl -X POST http://localhost:3000/transactions/confirm -H "Content-Type: application/json" -d "{\"transaction_ref\": \"$TX_REF\"}"
  ```




