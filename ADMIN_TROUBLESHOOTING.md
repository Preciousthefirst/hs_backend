# 🔧 Admin Dashboard Troubleshooting

## ✅ What We Just Fixed

### **Issue 1: Login redirects to user dashboard instead of admin dashboard**
**Fixed!** ✅ Login now checks user role and redirects admins to `/admin`

### **Issue 2: "Failed to fetch reported reviews" error**
**Debugging added!** ✅ Better error messages to identify the problem

---

## 🧪 Testing Steps

### **Step 1: Verify You're Admin in Database**

Open phpMyAdmin and run:
```sql
SELECT id, name, email, role FROM users WHERE id = 1;
```

**Expected result:**
```
id | name | email              | role
1  | John | john@example.com   | admin
```

If `role` is NOT `'admin'`, run:
```sql
UPDATE users SET role = 'admin' WHERE id = 1;
```

---

### **Step 2: Clear Browser Cache**

**In Browser Console:**
```javascript
localStorage.clear();
// Then refresh the page
```

---

### **Step 3: Login Fresh**

1. Go to: `http://localhost:5173/login`
2. Enter your email & password
3. **Should automatically redirect to:** `http://localhost:5173/admin`

---

### **Step 4: Check Browser Console**

**Open DevTools (F12) → Console tab**

You should see:
```
🔐 Fetching reported reviews with token: eyJhbGciOiJIUzI1NiI...
📡 Response status: 200
✅ Fetched reported reviews: X reviews
```

**If you see errors**, they'll tell you what's wrong!

---

## 🔍 Common Issues & Solutions

### **Issue: "Not logged in. Please login first."**

**Cause:** No JWT token in localStorage

**Solution:**
1. Clear localStorage
2. Login again
3. Make sure login was successful

---

### **Issue: "Access denied" or 403 error**

**Cause:** You're not an admin

**Solution:**
```sql
-- Check your role
SELECT id, email, role FROM users WHERE email = 'your_email@example.com';

-- If role is not 'admin', update it:
UPDATE users SET role = 'admin' WHERE email = 'your_email@example.com';
```

Then:
1. Clear localStorage
2. Login again

---

### **Issue: "Failed to fetch reported reviews (401)"**

**Cause:** JWT token is invalid or expired

**Solution:**
1. Clear localStorage
2. Login again (tokens expire after 1 hour)

---

### **Issue: "Failed to fetch reported reviews (500)"**

**Cause:** Backend database error

**Solution:**
1. Check backend console for errors
2. Make sure `review_reports` table exists:

```sql
CREATE TABLE IF NOT EXISTS review_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    user_id INT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_review_report (user_id, review_id)
);
```

---

### **Issue: Backend not running**

**Symptoms:**
- "Failed to fetch"
- Connection refused errors

**Solution:**
```bash
cd /Users/nal/Documents/hangoutspots_backend
node app.js
```

Should see:
```
Server running on port 3000
```

---

### **Issue: Frontend not running**

**Solution:**
```bash
cd /Users/nal/Documents/hangoutspots_frontend
npm run dev
```

Should see:
```
Local: http://localhost:5173/
```

---

## 🧪 Complete Test Flow

### **1. Make Sure Backend is Running:**
```bash
cd /Users/nal/Documents/hangoutspots_backend
node app.js
```

### **2. Make Sure Frontend is Running:**
```bash
cd /Users/nal/Documents/hangoutspots_frontend
npm run dev
```

### **3. Make Sure You're Admin:**
```sql
UPDATE users SET role = 'admin' WHERE id = 1;
```

### **4. Clear Cache & Login:**
1. Open browser
2. Press F12 (open DevTools)
3. Go to Console tab
4. Run: `localStorage.clear()`
5. Go to: `http://localhost:5173/login`
6. Login with your credentials

### **5. Should Auto-Redirect:**
After login, you should be at: `http://localhost:5173/admin`

### **6. Check Console:**
Look for these messages:
- ✅ `🔐 Fetching reported reviews...`
- ✅ `📡 Response status: 200`
- ✅ `✅ Fetched reported reviews...`

### **7. If You See Errors:**
The console will show exactly what's wrong!

---

## 📊 Debug Checklist

Before asking for help, verify:

- [ ] Backend is running (`node app.js`)
- [ ] Frontend is running (`npm run dev`)
- [ ] User role is 'admin' in database
- [ ] Cleared browser cache
- [ ] Logged in successfully
- [ ] Checked browser console for errors
- [ ] JWT token exists (check localStorage)

---

## 🔐 Verify JWT Token

### **Check if you have a token:**
```javascript
// In browser console:
console.log(localStorage.getItem('token'));
```

Should show a long string like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Decode the token:**
```javascript
// In browser console:
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('User role:', payload.role);
console.log('User ID:', payload.id);
console.log('Expires:', new Date(payload.exp * 1000));
```

Should show:
```
User role: admin
User ID: 1
Expires: [future date]
```

---

## 🎯 Quick Fix Commands

### **If Nothing Works, Try This:**

```bash
# 1. Stop both servers (Ctrl+C)

# 2. Restart backend
cd /Users/nal/Documents/hangoutspots_backend
node app.js

# 3. Restart frontend (new terminal)
cd /Users/nal/Documents/hangoutspots_frontend
npm run dev

# 4. In browser console:
localStorage.clear();

# 5. Login at:
http://localhost:5173/login
```

---

## 💡 Pro Tip

**Keep DevTools Console Open**

When testing admin features:
1. Press F12 to open DevTools
2. Go to Console tab
3. Keep it open while using the admin dashboard
4. You'll see all the debug messages!

---

## ✅ Success Indicators

When everything is working, you should see:

### **After Login:**
- ✅ Redirects to `/admin` automatically
- ✅ See 4 tabs (Reported, Users, Subscriptions, Transactions)
- ✅ No error messages

### **In Console:**
- ✅ `🔐 Fetching...` messages
- ✅ `📡 Response status: 200`
- ✅ `✅ Fetched...` messages
- ✅ No red error messages

### **On Each Tab:**
- ✅ Statistics cards show numbers
- ✅ Tables/lists show data (or "no data" message)
- ✅ Action buttons work

---

## 🆘 Still Having Issues?

Check the browser console and note:
1. **What error message you see**
2. **What HTTP status code (401, 403, 500, etc.)**
3. **Which tab you're on**

This will help identify the exact problem!




