# 🚀 Admin Dashboard - Quick Start

## 3-Minute Setup

### **Step 1: Create Admin Account (30 seconds)**

Open phpMyAdmin and run:
```sql
UPDATE users SET role = 'admin' WHERE id = 1;
```
*(Replace 1 with your user ID)*

### **Step 2: Start Servers (1 minute)**

**Backend:**
```bash
cd /Users/nal/Documents/hangoutspots_backend
node app.js
```

**Frontend (new terminal):**
```bash
cd /Users/nal/Documents/hangoutspots_frontend
npm run dev
```

### **Step 3: Login & Access (30 seconds)**

1. Go to: `http://localhost:5173/login`
2. Login with your account
3. Visit: `http://localhost:5173/admin`

**Done!** 🎉

---

## ✅ What You'll See

### **4 Tabs:**

**🚩 Reported Reviews**
- View & delete reported content
- Statistics on reports

**👥 Users**
- All user accounts
- Change roles
- Delete users
- Search functionality

**💳 Subscriptions**
- Active/expired subscriptions
- Upload tracking
- Statistics

**💰 Transactions**
- Revenue tracking
- Transaction history
- Financial statistics

---

## 🎯 Quick Actions

### **Delete a Reported Review:**
1. Go to "Reported Reviews" tab
2. Click "Delete Review"
3. Confirm

### **Make Someone Admin:**
1. Go to "Users" tab
2. Find the user
3. Click "→ Admin"

### **Check Today's Revenue:**
1. Go to "Transactions" tab
2. Look at "Today's Revenue" card

---

## 📚 Full Documentation

For detailed info, see:
- `ADMIN_DASHBOARD_GUIDE.md` - Complete guide
- `CREATE_ADMIN.md` - Admin account setup
- `ADMIN_COMPLETE.md` - Feature summary

---

## ⚠️ Troubleshooting

**Can't access /admin?**
→ Make sure your role is 'admin' in database

**No data showing?**
→ Check both backend & frontend are running

**Need more help?**
→ Check the full guides!

---

**That's it! Start managing your platform now!** 👨‍💼




