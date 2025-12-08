# MongoDB & Firebase Migration Guide

## ✅ Completed Migrations

### Database Migration (MySQL → MongoDB)
- ✅ `db.js` - Updated to export all Mongoose models
- ✅ `routes/users.js` - Converted to MongoDB
- ✅ `routes/transactions.js` - Converted to MongoDB
- ✅ `routes/subscriptions.js` - Converted to MongoDB
- ✅ `routes/checkins.js` - Converted to MongoDB
- ✅ `routes/businesses.js` - Converted to MongoDB
- ✅ `routes/leaderboard.js` - Converted to MongoDB
- ✅ `routes/reservations.js` - Converted to MongoDB
- ✅ `utils/gamification.js` - Converted to MongoDB
- ⚠️ `routes/reviews.js` - **PENDING** (Large file, needs conversion)

### Firebase Configuration
- ✅ `firebase.json` - Created hosting configuration
- ✅ `.firebaserc` - Created project configuration
- ✅ `package.json` - Added Firebase deployment scripts

## 🔧 Setup Instructions

### 1. MongoDB Atlas Connection

1. Get your MongoDB Atlas connection string from your Atlas dashboard
2. Create a `.env` file in the backend root directory with:
   ```
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   ```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase (if not already done):
   ```bash
   firebase init
   ```

4. Update `.firebaserc` with your actual Firebase project ID

### 4. Important Notes

#### Backend Hosting
- **Firebase Hosting** is for static frontend files only
- For the **Node.js backend**, you have two options:
  1. **Firebase Functions** - Convert Express routes to Firebase Functions
  2. **Alternative hosting** - Use services like:
     - Render.com
     - Railway.app
     - Heroku
     - DigitalOcean App Platform
     - AWS Elastic Beanstalk

#### MongoDB ObjectIds
- All user IDs in JWT tokens are now strings (MongoDB ObjectId strings)
- When comparing IDs, use string comparison: `req.user.id === userId` (not `parseInt`)
- ObjectIds are automatically converted to strings when using `.toString()`

#### Remaining Work
- `routes/reviews.js` still needs to be converted from MySQL to MongoDB
- This is the largest route file with complex queries
- All other routes have been successfully migrated

## 🚀 Deployment Steps

### For Backend (Node.js/Express):
1. Choose a hosting service (Render, Railway, etc.)
2. Set environment variables in hosting dashboard
3. Deploy your code
4. Update frontend API URLs to point to your backend

### For Frontend:
1. Build your frontend: `npm run build`
2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```

## 📝 Environment Variables Needed

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_secret_key_here
PORT=3000
FRONTEND_URL=https://your-frontend-url.com
GOOGLE_PLACES_API_KEY=your_google_api_key
```

## ⚠️ Breaking Changes

1. **User IDs**: Changed from integers to MongoDB ObjectId strings
2. **Database Queries**: All SQL queries replaced with Mongoose operations
3. **Date Handling**: MongoDB uses native Date objects (no MySQL DATE functions)
4. **Aggregations**: Some complex SQL aggregations converted to MongoDB aggregation pipeline or Promise.all()

## 🔍 Testing Checklist

- [ ] User registration and login
- [ ] Review creation and retrieval
- [ ] Business search and creation
- [ ] Check-in functionality
- [ ] Transaction and subscription flows
- [ ] Leaderboard and achievements
- [ ] Admin endpoints

## 📞 Support

If you encounter issues:
1. Check MongoDB Atlas connection
2. Verify all environment variables are set
3. Check that all models are properly imported
4. Review MongoDB query syntax vs SQL

