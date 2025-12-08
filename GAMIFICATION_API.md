# 🎮 Gamification System API Documentation

## Overview
This gamification system rewards users for engagement with points, levels, badges, and achievements. It includes anti-gaming measures to ensure fairness.

---

## 📊 Points System

### How Points Are Earned

| Action | Points | Notes |
|--------|--------|-------|
| Post a review | +10 | Base points |
| Add media to review | +5 | Bonus for photos/videos |
| First review on a business | x2 | Doubles all review points |
| Receive a "like" on review | +2 | Awarded to review author |
| Receive a "dislike" | -1 | Deducted from review author |
| Check in to a business | +10 | Once per business per 24h |
| Report inappropriate content | +1 | Optional (can be enabled) |

### Point Reactions (Like/Dislike Logic)

When users react to reviews, the **review author** earns or loses points:

| Reaction Change | Points Change to Author |
|----------------|------------------------|
| None → Like | +2 |
| None → Dislike | -1 |
| Like → Dislike | -3 (removes +2, applies -1) |
| Dislike → Like | +3 (removes -1, applies +2) |
| Like → None | -2 |
| Dislike → None | +1 |

---

## 🏆 Levels System

Levels are **automatically calculated** based on total points:

| Level | Points Required | Title | Icon |
|-------|----------------|-------|------|
| 1 | 0-49 | New Explorer | 🌱 |
| 2 | 50-199 | City Scout | 🔍 |
| 3 | 200-499 | Local Guide | 🗺️ |
| 4 | 500-999 | Community Star | ⭐ |
| 5 | 1000+ | Elite Reviewer | 🌟 |

**Note:** No special perks for levels (currently status/credibility only).

---

## 🏅 Achievements/Badges

Achievements are **one-time rewards** stored in the database:

| Badge | Requirement | Bonus Points |
|-------|-------------|--------------|
| 🌱 First Step | Submit 1st review | +10 |
| 📸 Shutterbug | Upload 1st photo | +5 |
| 🔥 10 Reviews | Post 10 reviews | +50 |
| 💯 50 Reviews | Post 50 reviews | +200 |
| 🏆 100 Reviews | Post 100 reviews | +500 |
| 📍 Check-in Champion | Complete 10 check-ins | +30 |

---

## 🛡️ Anti-Gaming Guards

To keep the system fair:

1. **Daily Points Cap**: Users can earn max **500 points per day**
2. **Review Frequency**: One review per business per **7 days**
3. **Self-Reactions Blocked**: Users cannot like/dislike their own reviews
4. **Check-in Cooldown**: One check-in per business per **24 hours**

---

## 🔥 API Endpoints

### 1. Check-ins

#### POST `/checkins`
Create a new check-in (requires JWT authentication).

**Request Body:**
```json
{
  "business_id": 5
}
```

**Response (201):**
```json
{
  "message": "Check-in successful!",
  "checkin_id": 123,
  "business_name": "The Coffee Spot",
  "points_awarded": 10,
  "new_achievements": ["checkin_champion"]
}
```

**Error (429):** Too many check-ins
```json
{
  "error": "You can only check in once per 24 hours",
  "hoursRemaining": 18,
  "lastCheckin": "2025-10-24T10:30:00.000Z"
}
```

---

#### GET `/checkins/user/:userId`
Get all check-ins for a user.

**Response:**
```json
[
  {
    "id": 123,
    "created_at": "2025-10-25T08:00:00.000Z",
    "business_id": 5,
    "business_name": "The Coffee Spot",
    "category": "Cafe",
    "address": "123 Main St"
  }
]
```

---

#### GET `/checkins/business/:businessId`
Get all check-ins for a business (last 50).

---

#### GET `/checkins/stats/:userId`
Get check-in statistics for a user.

**Response:**
```json
{
  "total_checkins": 25,
  "unique_businesses": 15,
  "last_checkin": "2025-10-25T08:00:00.000Z"
}
```

---

### 2. Leaderboard

#### GET `/leaderboard?range=all&limit=50`
Get top users by points.

**Query Params:**
- `range`: `all`, `weekly`, `monthly` (default: `all`)
- `limit`: Number of users to return (default: `50`)

**Response:**
```json
{
  "range": "all",
  "total_users": 50,
  "leaderboard": [
    {
      "rank": 1,
      "user_id": 42,
      "username": "Sarah",
      "points": 1250,
      "level": {
        "level": 5,
        "title": "Elite Reviewer",
        "icon": "🌟",
        "nextLevel": null,
        "progress": 100
      },
      "stats": {
        "reviews": 85,
        "checkins": 32,
        "achievements": 6
      },
      "member_since": "2025-01-15T00:00:00.000Z"
    }
  ]
}
```

---

#### GET `/leaderboard/user/:userId`
Get user's rank and nearby users (5 above and 5 below).

**Response:**
```json
{
  "user": {
    "id": 123,
    "name": "John",
    "points": 350,
    "rank": 45,
    "level": {
      "level": 3,
      "title": "Local Guide",
      "icon": "🗺️",
      "nextLevel": 500,
      "progress": 70
    },
    "stats": {
      "reviews": 28,
      "checkins": 12,
      "achievements": 3
    }
  },
  "nearby_users": [
    { "id": 44, "name": "Alice", "points": 360, "level": 3 },
    { "id": 123, "name": "John", "points": 350, "level": 3 }
  ]
}
```

---

### 3. User Profile

#### GET `/users/:id/profile`
Get complete user profile with gamification data.

**Response:**
```json
{
  "user": {
    "id": 123,
    "name": "John",
    "email": "john@example.com",
    "points": 350,
    "level": {
      "level": 3,
      "title": "Local Guide",
      "icon": "🗺️",
      "nextLevel": 500,
      "progress": 70
    },
    "rank": 45,
    "member_since": "2025-02-10T00:00:00.000Z"
  },
  "stats": {
    "reviews": 28,
    "checkins": 12,
    "likes_received": 45,
    "businesses_reviewed": 18
  },
  "achievements": [
    {
      "name": "First Step",
      "icon": "🌱",
      "description": "Posted your first review",
      "type": "first_review",
      "awarded_at": "2025-02-11T00:00:00.000Z"
    }
  ],
  "daily_limit": {
    "points_earned_today": 150,
    "points_remaining_today": 350,
    "cap": 500
  }
}
```

---

### 4. Review Reactions (Enhanced)

#### POST `/reviews/:id/react`
React to a review (like/dislike/remove) with author points adjustment.

**Request Body:**
```json
{
  "user_id": 123,
  "reaction": "like"
}
```

**Valid reactions:** `like`, `dislike`, `none` (to remove reaction)

**Response:**
```json
{
  "message": "Reaction recorded",
  "points_change": 2
}
```

**Error (403):** Self-reaction blocked
```json
{
  "error": "You cannot react to your own review"
}
```

---

### 5. Post Review (Updated)

#### POST `/reviews`
Submit a new review with gamification features.

**Response (Enhanced):**
```json
{
  "message": "Review submitted successfully",
  "review_id": 456,
  "points_awarded": 20,
  "new_achievements": ["first_review", "first_photo"]
}
```

**Error (429):** Too frequent reviews
```json
{
  "error": "You can only review this business once every 7 days",
  "lastReview": "2025-10-20T00:00:00.000Z"
}
```

---

## 🗄️ Database Tables

### `checkins`
```sql
CREATE TABLE checkins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    business_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_checkin (user_id, business_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
```

### `user_achievements`
```sql
CREATE TABLE user_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_achievement (user_id, achievement_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### `users` (Updated Columns)
```sql
ALTER TABLE users 
ADD COLUMN points_today INT DEFAULT 0,
ADD COLUMN points_reset_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN level INT DEFAULT 1;
```

---

## 🧪 Testing

Test the full flow with these commands:

```bash
# 1. Create a transaction
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "amount": 2000, "method": "mobile_money"}'

# 2. Confirm payment
curl -X POST http://localhost:3000/transactions/confirm \
  -H "Content-Type: application/json" \
  -d '{"transaction_ref": "TXN-1729876543210-A1B2C3D4"}'

# 3. Post a review (requires JWT)
curl -X POST http://localhost:3000/reviews \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "business_name=The Coffee Spot" \
  -F "address=123 Main St" \
  -F "text=Great place!"

# 4. Check in to a business
curl -X POST http://localhost:3000/checkins \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"business_id": 5}'

# 5. View leaderboard
curl http://localhost:3000/leaderboard?range=weekly&limit=10

# 6. View user profile
curl http://localhost:3000/users/1/profile
```

---

## 🎯 Next Steps

Optional enhancements you can add later:

1. **Perks for Levels**: Give high-level users bonus points or free uploads
2. **More Achievements**: Add creative badges (e.g., "Weekend Warrior", "Night Owl")
3. **Streaks**: Reward consecutive days of activity
4. **Team Challenges**: Group competitions for points
5. **Seasonal Events**: Double points during special periods

---

## 📝 Notes

- All points are subject to the **500 points/day cap**
- Achievements are **one-time only** (can't be earned twice)
- Levels update automatically when points change
- Check-ins and reviews both contribute to stats

