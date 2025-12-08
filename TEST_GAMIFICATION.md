# 🎮 Gamification System Testing Guide

## 🚀 Quick Start

### 1. Start the Server
```bash
cd /Users/nal/Documents/hangoutspots_backend
node app.js
```

Expected output:
```
JWT_SECRET: !COn5uMpT10N2025!
User routes loaded
App is running and routes are set up
Server running on http://localhost:3000
```

---

## ✅ Test Scenarios

### Scenario 1: New User Journey

#### Step 1: Register a new user
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@test.com",
    "password": "password123"
  }'
```

#### Step 2: Login
```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "password": "password123"
  }'
```

Save the JWT token from the response!

#### Step 3: Buy a subscription
```bash
# Create transaction
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "amount": 2000,
    "method": "mobile_money"
  }'

# Confirm payment (use the transaction_ref from above)
curl -X POST http://localhost:3000/transactions/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_ref": "TXN-XXXXX"
  }'
```

#### Step 4: Post first review (🌱 First Step Badge!)
```bash
curl -X POST http://localhost:3000/reviews \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "business_name=The Coffee House" \
  -F "address=123 Main St" \
  -F "category=Cafe" \
  -F "text=Amazing coffee and great atmosphere!" \
  -F "rating=5"
```

Expected points: **+20** (10 base × 2 for first review)
Expected achievements: **🌱 First Step** (+10 bonus)

#### Step 5: Post review with photo (📸 Shutterbug Badge!)
```bash
curl -X POST http://localhost:3000/reviews \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "business_name=Pizza Palace" \
  -F "address=456 Oak St" \
  -F "text=Best pizza in town!" \
  -F "rating=5" \
  -F "media=@/path/to/photo.jpg"
```

Expected points: **+15** (10 base + 5 media)
Expected achievements: **📸 Shutterbug** (+5 bonus)

#### Step 6: Check in to a business
```bash
curl -X POST http://localhost:3000/checkins \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": 1
  }'
```

Expected points: **+10**

#### Step 7: View profile
```bash
curl http://localhost:3000/users/1/profile
```

Expected:
- Points: ~60
- Level: 2 (City Scout 🔍)
- Achievements: First Step, Shutterbug
- Daily limit: Points earned/remaining

---

### Scenario 2: Test Anti-Gaming Guards

#### Test 1: Try to like your own review
```bash
curl -X POST http://localhost:3000/reviews/1/react \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "reaction": "like"
  }'
```

Expected: **403 Error** - "You cannot react to your own review"

#### Test 2: Try to review same business twice in 7 days
```bash
curl -X POST http://localhost:3000/reviews \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "business_name=The Coffee House" \
  -F "address=123 Main St" \
  -F "text=Another review"
```

Expected: **429 Error** - "You can only review this business once every 7 days"

#### Test 3: Try to check in twice in 24h
```bash
curl -X POST http://localhost:3000/checkins \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": 1
  }'
```

Expected: **429 Error** - "You can only check in once per 24 hours"

#### Test 4: Try to earn more than 500 points in a day
Post 34+ reviews in one day (10 points each = 340+).
On the 51st review, you should get 0 points (daily cap reached).

---

### Scenario 3: Reaction Points System

#### Setup: Create two users
User 1 (author): Posts a review
User 2 (reactor): Likes/dislikes the review

#### Test: User 2 likes User 1's review
```bash
curl -X POST http://localhost:3000/reviews/1/react \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "reaction": "like"
  }'
```

Expected: User 1 gets **+2 points**

#### Test: User 2 changes to dislike
```bash
curl -X POST http://localhost:3000/reviews/1/react \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "reaction": "dislike"
  }'
```

Expected: User 1 loses **-3 points** (removes +2, applies -1)

#### Test: User 2 removes reaction
```bash
curl -X POST http://localhost:3000/reviews/1/react \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "reaction": "none"
  }'
```

Expected: User 1 gains **+1 point** (removes -1)

---

### Scenario 4: Leaderboard

#### View global leaderboard
```bash
curl http://localhost:3000/leaderboard?range=all&limit=10
```

#### View weekly leaderboard
```bash
curl http://localhost:3000/leaderboard?range=weekly&limit=10
```

#### View user's rank and nearby users
```bash
curl http://localhost:3000/leaderboard/user/1
```

---

### Scenario 5: Achievement Milestones

Create multiple reviews to trigger milestones:

#### 10 Reviews Milestone (🔥)
Post 10 reviews → Get **+50 bonus points**

#### 50 Reviews Milestone (💯)
Post 50 reviews → Get **+200 bonus points**

#### 100 Reviews Milestone (🏆)
Post 100 reviews → Get **+500 bonus points**

#### Check-in Champion (📍)
Check in to 10 different businesses → Get **+30 bonus points**

---

## 🎯 Expected Level Progression

| Reviews | Points (approx) | Level | Title |
|---------|----------------|-------|-------|
| 0 | 0 | 1 | New Explorer 🌱 |
| 3 | 60 | 2 | City Scout 🔍 |
| 10 | 200 | 3 | Local Guide 🗺️ |
| 30 | 600 | 4 | Community Star ⭐ |
| 60 | 1200 | 5 | Elite Reviewer 🌟 |

---

## 🐛 Common Issues

### Issue 1: "No uploads left"
**Solution:** Create a subscription for the user:
```sql
INSERT INTO subscriptions (user_id, uploads_remaining, start_date, expiry_date)
VALUES (1, 5, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY));
```

### Issue 2: Points not updating
**Solution:** Check if daily cap (500) is reached:
```sql
SELECT points, points_today, points_reset_date FROM users WHERE id = 1;
```

### Issue 3: Achievement not awarded
**Solution:** Check if already earned:
```sql
SELECT * FROM user_achievements WHERE user_id = 1;
```

### Issue 4: Level not updating
**Solution:** Levels auto-update when points change. Check:
```sql
SELECT id, name, points, level FROM users WHERE id = 1;
```

---

## 📊 Useful SQL Queries

### Check user stats
```sql
SELECT 
    u.id, u.name, u.points, u.level,
    COUNT(DISTINCT r.id) AS reviews,
    COUNT(DISTINCT c.id) AS checkins,
    COUNT(DISTINCT a.id) AS achievements
FROM users u
LEFT JOIN reviews r ON u.id = r.user_id
LEFT JOIN checkins c ON u.id = c.user_id
LEFT JOIN user_achievements a ON u.id = a.user_id
WHERE u.id = 1
GROUP BY u.id;
```

### View all achievements for a user
```sql
SELECT * FROM user_achievements WHERE user_id = 1;
```

### Reset daily points (for testing)
```sql
UPDATE users 
SET points_today = 0, points_reset_date = CURRENT_DATE 
WHERE id = 1;
```

### View leaderboard manually
```sql
SELECT id, name, points, level 
FROM users 
ORDER BY points DESC 
LIMIT 10;
```

---

## ✅ Success Criteria

Your gamification system is working if:

1. ✅ Users earn points for reviews, media, and check-ins
2. ✅ Achievements are awarded automatically (First Step, Shutterbug, etc.)
3. ✅ Daily cap (500 points) is enforced
4. ✅ Users can't like their own reviews
5. ✅ Users can't review same business twice in 7 days
6. ✅ Levels update automatically when points change
7. ✅ Leaderboard shows top users correctly
8. ✅ User profile shows all gamification data
9. ✅ Reaction points (like/dislike) affect review authors correctly
10. ✅ Check-in cooldown (24h) is enforced

---

## 🎉 What's Next?

Now that gamification is working, you can:

1. **Build Frontend Components**:
   - User profile page with level/badges
   - Leaderboard page
   - Achievement notifications
   - Points counter in navbar

2. **Add More Features**:
   - Streaks (consecutive days of activity)
   - Team challenges
   - Seasonal events (double points weekends)
   - More achievement types

3. **Fine-tune Balance**:
   - Adjust point values based on user behavior
   - Add new achievement milestones
   - Consider adding level perks

Enjoy your gamification system! 🚀




