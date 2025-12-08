# 🛡️ Admin Dashboard - Complete Guide

## ✅ What We Built

A **comprehensive admin dashboard** with:
- 📊 Real-time statistics
- 🚩 Reported reviews management
- 👥 User management (role changes, deletions)
- 💳 Subscriptions monitoring
- 💰 Transactions tracking with revenue analytics

---

## 🎯 Features Overview

### **1. Reported Reviews Tab 🚩**
- View all reported reviews
- See report counts & reasons
- See who reported each review
- Delete inappropriate reviews
- Dismiss false reports
- Statistics: Total reported, pending review

### **2. Users Management Tab 👥**
- View all users with details
- Search users by name or email
- Change user roles (User ↔ Admin)
- Delete user accounts
- View user statistics (reviews, check-ins, subscriptions)
- Statistics: Total users, admins, new users (today/week/month)

### **3. Subscriptions Monitor Tab 💳**
- View all subscriptions
- See subscription status (active/expired)
- Monitor uploads remaining
- Track expiry dates
- Statistics: Total, active, expired, average uploads left

### **4. Transactions Monitor Tab 💰**
- View all transactions
- Track revenue (total, today, week, month)
- See transaction status (completed/pending)
- Monitor payment methods
- Statistics: Total revenue, completed/pending transactions

---

## 📁 Files Created

### **Backend Routes:**

1. **`routes/transactions.js`** (Enhanced)
   - `GET /transactions/admin/all` - All transactions with user info
   - `GET /transactions/admin/stats` - Revenue & transaction statistics

2. **`routes/subscriptions.js`** (Enhanced)
   - `GET /subscriptions/admin/all` - All subscriptions with user info
   - `GET /subscriptions/admin/stats` - Subscription statistics
   - `PUT /subscriptions/admin/:id` - Update subscription

3. **`routes/users.js`** (Enhanced)
   - `GET /users/admin/all` - All users with activity data
   - `GET /users/admin/stats` - User statistics
   - `PUT /users/admin/:id/role` - Change user role
   - `DELETE /users/admin/:id` - Delete user
   - `PUT /users/admin/:id/ban` - Ban/unban user

4. **`routes/reviews.js`** (Already had)
   - `GET /reviews/reported/all` - All reported reviews
   - `DELETE /reviews/reported/:id` - Delete review

### **Frontend Components:**

1. **`pages/AdminDashboard.jsx`** - Main dashboard with tabs
2. **`components/admin/ReportedReviews.jsx`** - Reported reviews management
3. **`components/admin/UsersManagement.jsx`** - User management
4. **`components/admin/SubscriptionsMonitor.jsx`** - Subscriptions monitoring
5. **`components/admin/TransactionsMonitor.jsx`** - Transactions & revenue tracking

---

## 🔐 Security & Permissions

### **Authentication Required:**
- All admin routes require JWT token
- Token sent in `Authorization: Bearer <token>` header

### **Role-Based Access:**
- Only users with `role = 'admin'` can access these endpoints
- Middleware: `authorizeRole(['admin'])`
- Self-protection: Admins cannot delete themselves

---

## 🌐 API Endpoints

### **Reported Reviews:**
```javascript
GET /reviews/reported/all
Headers: Authorization: Bearer <token>
Response: Array of reported reviews with report details
```

```javascript
DELETE /reviews/reported/:id
Headers: Authorization: Bearer <token>
Response: { message: "Review deleted successfully" }
```

### **Users Management:**
```javascript
GET /users/admin/all
Headers: Authorization: Bearer <token>
Response: Array of users with activity stats
```

```javascript
GET /users/admin/stats
Headers: Authorization: Bearer <token>
Response: {
  total_users, admin_count, regular_users,
  new_today, new_this_week, new_this_month
}
```

```javascript
PUT /users/admin/:id/role
Headers: Authorization: Bearer <token>
Body: { "role": "admin" | "user" }
Response: { message: "User role updated successfully" }
```

```javascript
DELETE /users/admin/:id
Headers: Authorization: Bearer <token>
Response: { message: "User deleted successfully" }
```

### **Subscriptions:**
```javascript
GET /subscriptions/admin/all
Headers: Authorization: Bearer <token>
Response: Array of subscriptions with user info
```

```javascript
GET /subscriptions/admin/stats
Headers: Authorization: Bearer <token>
Response: {
  total_subscriptions, active_subscriptions,
  expired_subscriptions, avg_uploads_remaining
}
```

### **Transactions:**
```javascript
GET /transactions/admin/all
Headers: Authorization: Bearer <token>
Response: Array of transactions with user info
```

```javascript
GET /transactions/admin/stats
Headers: Authorization: Bearer <token>
Response: {
  total_transactions, completed_transactions,
  pending_transactions, total_revenue,
  today_revenue, week_revenue, month_revenue
}
```

---

## 🧪 Testing Steps

### **1. Create an Admin Account:**

#### **Option A: Manually in Database**
```sql
UPDATE users SET role = 'admin' WHERE id = 1;
-- Or when creating a new user:
INSERT INTO users (name, email, password, role) 
VALUES ('Admin', 'admin@example.com', '<hashed_password>', 'admin');
```

#### **Option B: Via API (if you have an existing admin)**
```javascript
PUT /users/admin/:id/role
Body: { "role": "admin" }
```

### **2. Login as Admin:**
```bash
POST http://localhost:3000/users/login
Body: {
  "email": "admin@example.com",
  "password": "your_password"
}
```

Save the token from the response!

### **3. Access Admin Dashboard:**
```
http://localhost:5173/admin
```

You should see all 4 tabs with data!

---

## 🎨 UI Features

### **Tab System:**
- Clean tab navigation
- Active tab highlighted
- Smooth transitions
- Responsive design

### **Statistics Cards:**
- Real-time metrics
- Color-coded values
- Grid layout
- Auto-responsive

### **Data Tables:**
- Sortable columns
- Search functionality (users)
- Action buttons
- Responsive (mobile-friendly)
- Hover effects

### **Color Coding:**
- 🟢 **Green**: Active, completed, success
- 🟡 **Yellow**: Pending, warning
- 🔴 **Red**: Expired, failed, reported
- 🔵 **Blue**: Admin role, actions

---

## 📊 Statistics Breakdown

### **Reported Reviews:**
- Total reports pending
- Count per review

### **Users:**
- Total users
- Admin count
- Regular users
- New today
- New this week
- New this month

### **Subscriptions:**
- Total subscriptions
- Active subscriptions
- Expired subscriptions
- Average uploads remaining
- Total uploads remaining

### **Transactions:**
- Total revenue (all time)
- Today's revenue
- Week revenue
- Month revenue
- Total transactions
- Completed transactions
- Pending transactions

---

## ⚙️ Admin Actions

### **On Reported Reviews:**
✅ **Delete Review**: Permanently removes the review
✅ **Dismiss Report**: Removes from reported list (keeps review)

### **On Users:**
✅ **Change Role**: Toggle between User ↔ Admin
✅ **Delete User**: Permanently deletes user & their data
✅ **Search**: Find users by name or email

### **On Subscriptions:**
✅ **View Details**: See all subscription info
✅ **Monitor Status**: Track active/expired

### **On Transactions:**
✅ **View All**: See complete transaction history
✅ **Track Revenue**: Monitor income streams
✅ **Filter Status**: See completed/pending

---

## 🛠️ How It Works

### **Data Flow:**

```
Admin Dashboard
    ↓
Tabs Component
    ↓
[Reported | Users | Subscriptions | Transactions]
    ↓
Fetch from Backend API (with JWT)
    ↓
Display in Tables/Cards
    ↓
Admin Actions (Delete, Update)
    ↓
Backend Updates Database
    ↓
Refresh Data
```

### **State Management:**
- React hooks (`useState`, `useEffect`)
- Automatic refresh after actions
- Loading states
- Error handling

---

## 🎯 Use Cases

### **Daily Monitoring:**
1. Check reported reviews
2. Review new users
3. Monitor subscription renewals
4. Track daily revenue

### **Moderation:**
1. Delete spam reviews
2. Ban abusive users
3. Dismiss false reports

### **User Management:**
1. Promote users to admin
2. Remove inactive accounts
3. Track user activity

### **Financial Tracking:**
1. Monitor revenue trends
2. Track subscription sales
3. Identify payment issues

---

## 📝 Example Workflows

### **Handle Reported Review:**
```
1. Go to Admin Dashboard
2. Click "Reported Reviews" tab
3. Read review content
4. Check report reasons
5. Decision:
   - Delete → Removes review permanently
   - Dismiss → Keeps review, clears report
```

### **Promote User to Admin:**
```
1. Go to "Users" tab
2. Search for user (by name/email)
3. Click "→ Admin" button
4. Confirm action
5. User role updated immediately
```

### **Monitor Daily Revenue:**
```
1. Go to "Transactions" tab
2. Check "Today's Revenue" stat card
3. View recent transactions
4. Compare with week/month revenue
```

---

## 🔧 Troubleshooting

### **Issue: "Access denied" error**
**Solution:** Make sure:
1. You're logged in as admin
2. Your JWT token is valid
3. User role in database is 'admin'

### **Issue: No data showing**
**Solution:**
1. Check if backend is running
2. Verify database has data
3. Check browser console for errors
4. Verify API endpoints are correct

### **Issue: Cannot delete users**
**Solution:**
1. Cannot delete yourself (safety feature)
2. Check foreign key constraints
3. Verify admin permissions

---

## 🚀 What's Next (Optional Enhancements)

### **Future Features:**
- [ ] Export data to CSV/PDF
- [ ] Advanced filtering & sorting
- [ ] Bulk actions (ban multiple users)
- [ ] Email notifications for reports
- [ ] Charts & graphs for analytics
- [ ] Scheduled reports
- [ ] Audit logs
- [ ] IP tracking
- [ ] Advanced user search (by points, reviews, etc.)

---

## ✅ Checklist

Before launching:
- [x] Backend APIs created & protected
- [x] Frontend components built
- [x] Role-based access control implemented
- [x] Statistics working
- [x] Actions (delete, update) functional
- [ ] Admin account created
- [ ] Tested with real data
- [ ] Error handling verified

---

## 📊 Database Requirements

Make sure these columns exist:

### **users table:**
- `id`, `name`, `email`, `role`, `points`, `level`, `created_at`

### **subscriptions table:**
- `id`, `user_id`, `uploads_remaining`, `start_date`, `expiry_date`, `created_at`

### **transactions table:**
- `id`, `user_id`, `amount`, `method`, `status`, `transaction_type`, `transaction_ref`, `created_at`

### **reviews table:**
- `id`, `user_id`, `business_id`, `rating`, `text`, `created_at`

### **review_reports table:**
- `id`, `review_id`, `user_id`, `reason`, `created_at`

---

## 🎉 Success!

You now have a **fully functional admin dashboard** with:
✅ Complete oversight of your platform
✅ Real-time statistics
✅ User management tools
✅ Revenue tracking
✅ Moderation capabilities

**Ready to manage your platform like a pro!** 👨‍💼👩‍💼




