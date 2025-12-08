# 🛡️ How to Create an Admin Account

## Quick Guide

You need an admin account to access the admin dashboard. Here are your options:

---

## ✅ Option 1: Update Existing User (Easiest)

### **Step 1: Find Your User ID**
Login to phpMyAdmin and run:
```sql
SELECT id, name, email, role FROM users;
```

### **Step 2: Make User Admin**
```sql
UPDATE users SET role = 'admin' WHERE id = 1;
-- Replace 1 with your actual user ID
```

### **Step 3: Login & Test**
1. Login with that account at `http://localhost:5173/login`
2. Go to `http://localhost:5173/admin`
3. You should see the admin dashboard! 🎉

---

## ✅ Option 2: Create New Admin (Recommended)

### **Step 1: Sign up normally**
1. Go to `http://localhost:5173/signup`
2. Create account with:
   - Name: Admin
   - Email: admin@yourdomain.com
   - Password: (your secure password)

### **Step 2: Update Role in Database**
```sql
UPDATE users SET role = 'admin' 
WHERE email = 'admin@yourdomain.com';
```

### **Step 3: Login**
1. Login at `http://localhost:5173/login`
2. Access admin dashboard at `http://localhost:5173/admin`

---

## ✅ Option 3: Manual Database Insert (Advanced)

### **Step 1: Hash Your Password**
Run this Node.js script:
```javascript
const bcrypt = require('bcryptjs');
const password = 'your_secure_password';
const hashed = bcrypt.hashSync(password, 10);
console.log(hashed);
```

### **Step 2: Insert Admin User**
```sql
INSERT INTO users (name, email, password, role, created_at) 
VALUES (
  'Admin User',
  'admin@yourdomain.com',
  '$2a$10$...', -- Your hashed password here
  'admin',
  NOW()
);
```

---

## 🧪 Testing Admin Access

### **1. Login:**
```
http://localhost:5173/login
```

### **2. Check Token:**
Open browser console and run:
```javascript
console.log(localStorage.getItem('token'));
```
You should see a JWT token.

### **3. Access Dashboard:**
```
http://localhost:5173/admin
```

### **4. Verify Features:**
- ✅ See 4 tabs (Reported, Users, Subscriptions, Transactions)
- ✅ View statistics
- ✅ See user list
- ✅ Can perform actions

---

## ⚠️ Important Security Notes

### **1. Strong Password:**
Use a strong password for admin accounts:
- At least 12 characters
- Mix of uppercase, lowercase, numbers, symbols

### **2. Limited Admin Accounts:**
- Only create admin accounts for trusted team members
- Don't share admin credentials

### **3. Regular Review:**
- Periodically check who has admin access
- Remove admin access when no longer needed

---

## 🔧 Troubleshooting

### **Issue: "Access denied" when visiting /admin**

**Check 1: Verify Role in Database**
```sql
SELECT id, name, email, role FROM users WHERE email = 'your_email@example.com';
```
Should show `role = 'admin'`

**Check 2: Clear Browser Cache**
```javascript
// In browser console:
localStorage.clear();
// Then login again
```

**Check 3: Check JWT Token**
Make sure your JWT token contains admin role:
```javascript
// The middleware checks req.user.role from the decoded token
```

### **Issue: Can see dashboard but no data**

**Check 1: Backend Running**
```bash
node app.js
# Should show: Server running on port 3000
```

**Check 2: Database Has Data**
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM reviews;
SELECT COUNT(*) FROM transactions;
```

**Check 3: API Endpoints**
Open browser console (Network tab) and check if API calls are returning 200 status.

---

## 📝 Quick Reference

### **Admin Routes (Frontend):**
- `/admin` - Main dashboard
- `/admin?tab=reported` - Reported reviews
- `/admin?tab=users` - User management
- `/admin?tab=subscriptions` - Subscriptions
- `/admin?tab=transactions` - Transactions

### **Required User Table Columns:**
- `id` - User ID
- `name` - User name
- `email` - User email
- `password` - Hashed password
- `role` - User role ('user' or 'admin')
- `points` - Gamification points
- `created_at` - Registration date

---

## ✅ All Set!

Once you have an admin account:
1. ✅ Login at `/login`
2. ✅ Access dashboard at `/admin`
3. ✅ Start managing your platform!

**Need help?** Check the main `ADMIN_DASHBOARD_GUIDE.md` for detailed documentation.




