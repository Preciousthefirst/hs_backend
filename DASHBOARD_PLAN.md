# 📊 User Dashboard Plan

## What Users Need to See

### 1️⃣ **Subscription Status Section**
**Location**: User Dashboard / Profile Page  
**API Endpoint**: `GET /api/subscriptions/user/:userId` *(need to create this)*

**Display**:
```
╔═══════════════════════════════════════╗
║  📦 YOUR SUBSCRIPTION                 ║
╠═══════════════════════════════════════╣
║  Uploads Remaining: 3 / 5             ║
║  Expires: March 25, 2025              ║
║  Status: Active ✅                    ║
║                                       ║
║  [Renew Subscription - UGX 2000]      ║
╚═══════════════════════════════════════╝
```

---

### 2️⃣ **Transaction History Section**
**Location**: User Dashboard / Transactions Page  
**API Endpoint**: `GET /transactions/user/:userId` *(already created!)*

**Display**:
```
╔═══════════════════════════════════════════════════════════════╗
║  📜 TRANSACTION HISTORY                                       ║
╠═══════════════════════════════════════════════════════════════╣
║  Date          | Amount    | Status      | Reference         ║
║  Oct 21, 2025  | UGX 2,000 | ✅ Completed | TXN-1729567-A1B2 ║
║  Oct 15, 2025  | UGX 2,000 | ✅ Completed | TXN-1729234-C3D4 ║
║  Oct 10, 2025  | UGX 2,000 | ⏳ Pending   | TXN-1729001-E5F6 ║
╚═══════════════════════════════════════════════════════════════╝
```

---

### 3️⃣ **Purchase Flow (Modal/Page)**
**When user clicks**: "Buy/Renew Subscription"

**Step 1**: Initiate Purchase
```javascript
// Frontend calls:
POST /transactions
Body: { user_id: 8, amount: 2000, method: "mobile_money" }

// Backend returns:
{
  "transaction_ref": "TXN-1729567890123-A1B2C3D4",
  "status": "pending"
}
```

**Step 2**: Show Payment Instructions
```
╔═══════════════════════════════════════╗
║  📱 COMPLETE PAYMENT                  ║
╠═══════════════════════════════════════╣
║  1. Dial *165# on your phone          ║
║  2. Select "Make Payment"             ║
║  3. Enter amount: UGX 2000            ║
║  4. Reference: TXN-1729567-A1B2       ║
║                                       ║
║  Waiting for payment...               ║
║  ⏳ [Checking status...]              ║
╚═══════════════════════════════════════╝
```

**Step 3**: Poll or Webhook Confirms
```javascript
// Mobile money provider calls:
POST /transactions/confirm
Body: { transaction_ref: "TXN-1729567890123-A1B2C3D4" }

// Backend:
// ✅ Updates transaction status to 'completed'
// ✅ Adds 5 uploads to subscription
// ✅ Extends expiry date
```

**Step 4**: Show Success
```
╔═══════════════════════════════════════╗
║  ✅ PAYMENT SUCCESSFUL!               ║
╠═══════════════════════════════════════╣
║  5 uploads added to your account      ║
║  Expires: November 21, 2025           ║
║                                       ║
║  [Start Reviewing!]                   ║
╚═══════════════════════════════════════╝
```

---

## Missing Backend Endpoints (Need to Create)

### ✅ Already Have:
- `POST /transactions` — Create pending transaction
- `POST /transactions/confirm` — Confirm payment
- `GET /transactions/:id` — Get single transaction
- `GET /transactions/user/:userId` — Get user's transactions

### ❌ Still Need:
- `GET /api/subscriptions/user/:userId` — Get user's current subscription
- `GET /api/subscriptions/:userId/status` — Check if subscription is active

---

## Frontend Components to Build

1. **SubscriptionCard.jsx**
   - Shows current uploads remaining
   - Shows expiry date
   - "Renew" button

2. **TransactionHistory.jsx**
   - Table of all user transactions
   - Filter by status (completed/pending)

3. **PurchaseModal.jsx**
   - Payment flow
   - Shows transaction reference
   - Polls for payment confirmation

4. **UploadWarning.jsx**
   - Shows when user has 0 uploads left
   - "Buy uploads to continue" button

---

## Example React Component Structure

```jsx
// UserDashboard.jsx
function UserDashboard({ userId }) {
  const [subscription, setSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Fetch subscription status
    fetch(`/api/subscriptions/user/${userId}`)
      .then(res => res.json())
      .then(setSubscription);

    // Fetch transactions
    fetch(`/transactions/user/${userId}`)
      .then(res => res.json())
      .then(setTransactions);
  }, [userId]);

  return (
    <div>
      <SubscriptionCard subscription={subscription} />
      <TransactionHistory transactions={transactions} />
    </div>
  );
}
```

---

## Summary

**Backend Status**: ✅ 80% Complete
- Transactions API: ✅ Done
- Subscription endpoints: ❌ Need to create

**Frontend Status**: ❌ Not started yet
- Dashboard: ❌ Need to build
- Purchase flow: ❌ Need to build
- Mobile money integration: ❌ Need API provider

**Next Steps**:
1. ✅ Test transactions API (use test_transactions.js)
2. Create subscription status endpoints
3. Build frontend dashboard
4. Integrate mobile money API (MTN/Airtel)


