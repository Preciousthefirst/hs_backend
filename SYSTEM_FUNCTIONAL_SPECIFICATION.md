# System Functional Specification
## HangoutSpots Platform

---

## 2. System Functional Specification

### 2.1 Functions Performed (Itemize and Describe)

#### 2.1.1 User Authentication & Management
- **User Registration**: New users can create accounts by providing name, email, and password. Passwords are hashed using bcrypt before storage.
- **User Login**: Users authenticate using email and password. System generates JWT tokens valid for 1 hour for session management.
- **User Profile Management**: Users can view their profile information including points, level, achievements, and activity statistics.
- **Role-Based Access Control**: System supports two user roles - 'user' (regular) and 'admin' (administrative). Admins have elevated privileges for platform management.

#### 2.1.2 Business Discovery & Management
- **Google Places API Integration**: Users can search for businesses using Google Places Autocomplete API, which provides real-time business suggestions as they type.
- **Business Details Retrieval**: System fetches comprehensive business information from Google Places Details API including name, address, coordinates, category, contact information, and editorial descriptions.
- **Business Auto-Fill**: When a user selects a business from search results, the system automatically populates form fields (name, category, address, location, division, contact, description) based on Google Places data.
- **Business Listing**: System maintains a database of businesses with details including name, category, description, location, division, address, contact, GPS coordinates (latitude/longitude), and place_id.
- **Business Detail Pages**: Users can view detailed information about specific businesses including all reviews, media, and check-in history.
- **Tag-Based Search (Core Discovery Feature)**: The most important feature for discovering hangout spots. Users (including non-authenticated visitors) can search for businesses by tags/moods/keywords:
  - **Public Access**: Search is available without authentication, allowing anyone to discover hangout spots
  - **Tag Matching**: System searches through all review tags to find businesses matching user's search query
  - **Multi-Keyword Support**: Users can search with multiple keywords (e.g., "date night", "family places", "group activities")
  - **Search Algorithm**: Searches for reviews where tags contain any of the search terms (case-insensitive, partial matching)
  - **Results**: Returns all reviews (and their associated businesses) that match the tag criteria, sorted by most recent
  - **Example Searches**: "date night", "family friendly", "group activities", "romantic", "kids", "outdoor", "quiet", etc.
  - **Purpose**: Helps users quickly find hangout spots based on what they're looking for or their current mood, eliminating time wasted browsing irrelevant options

#### 2.1.3 Review System
- **Review Submission**: Users can submit reviews for businesses including:
  - Rating (1-5 stars)
  - Text review content
  - **Tags**: User-defined tags describing the business/mood/activity type (e.g., "date night", "family friendly", "group activities", "romantic", "quiet", "outdoor"). Tags are stored as JSON array and are used for the core search/discovery feature.
  - Up to 4 media files (images or videos)
  - Business information (auto-filled from Google Places or manually entered)
- **Review Display**: Reviews are displayed with user information, ratings, text content, media, like counts, and timestamps.
- **Review Filtering**: Users can filter reviews by:
  - All reviews (global)
  - Reviews for specific business
  - User's own reviews
- **Review Reactions**: Users can like reviews (dislike functionality removed). Authors receive points when their reviews are liked.
- **Review Moderation**: Users can report inappropriate reviews. Admins can view reported reviews and delete them if necessary.
- **Anti-Gaming Measures**: 
  - Users can only review the same business once every 7 days
  - Users cannot like their own reviews
  - Daily point cap of 500 points per user

#### 2.1.4 Media Management
- **Media Upload**: Users can upload up to 4 media files (images or videos) per review using multer middleware.
- **Media Storage**: Media files are stored in the `/uploads` directory on the server.
- **Media Display**: Media is displayed on review cards, business detail pages, and user dashboards with support for both images and videos.

#### 2.1.5 Gamification System
- **Points System**: Users earn points for various activities:
  - Base review submission: 10 points
  - Media bonus: +5 points per review with media
  - First review bonus: Double points if it's the first review for a business
  - Review likes: +2 points to review author per like
  - Check-ins: +10 points per verified check-in
  - Reservation completion: +15 points
- **Level System**: Users progress through 5 levels based on total points:
  - Level 1: 0-99 points
  - Level 2: 100-499 points
  - Level 3: 500-999 points
  - Level 4: 1000-2499 points
  - Level 5: 2500+ points
- **Achievement System**: Users unlock achievement badges for milestones:
  - First review
  - First photo
  - First check-in
  - 10 reviews
  - 50 reviews
  - 100 reviews
  - 10 check-ins
  - 50 check-ins
  - Level 2, 3, 4, 5 achievements
- **Leaderboard**: System maintains rankings showing top users:
  - All-time leaderboard
  - Weekly leaderboard
  - Monthly leaderboard
- **Daily Point Cap**: Users can earn maximum 500 points per day to prevent gaming.

#### 2.1.6 Check-In System
- **GPS-Verified Check-Ins**: Users can check in to businesses with GPS location verification. System verifies user is within 500 meters of business location.
- **Check-In Frequency Control**: Users can check in to the same business only once per 24 hours.
- **Check-In History**: Users can view their check-in history and statistics.
- **Business Check-In Display**: Business pages show all users who have checked in.

#### 2.1.7 Reservation System
- **Reservation Creation**: Users can create reservations for businesses including:
  - Date and time
  - Number of people
  - Special requests/notes
- **Reservation Management**: 
  - Users can view their own reservations
  - Admins can view all reservations for a business
  - Reservation statuses: pending, confirmed, rejected, completed, no-show
- **Reservation Completion Rewards**: Users receive 15 points when a reservation is marked as completed.

#### 2.1.8 Subscription & Transaction Management
- **Subscription Purchase**: Users can purchase subscriptions (UGX 2000) to receive upload credits (5 uploads per subscription).
- **Subscription Status**: System tracks:
  - Active subscriptions (not expired, uploads remaining)
  - Expired subscriptions
  - Uploads remaining count
  - Subscription expiry dates
- **Transaction Processing**: 
  - Transaction creation with unique reference numbers
  - Payment confirmation workflow
  - Transaction status tracking (pending, completed, failed)
- **Subscription Auto-Renewal**: When a user purchases a new subscription, system extends expiry date by 30 days and adds 5 uploads.
- **Upload Deduction**: System automatically deducts 1 upload from subscription when user submits a review.

#### 2.1.9 Admin Dashboard
- **Reported Reviews Management**: Admins can view all reported reviews with report counts, reasons, and reporting users. Admins can delete inappropriate reviews.
- **User Management**: Admins can:
  - View all users with activity statistics
  - Search users by name or email
  - Change user roles (promote to admin or demote to user)
  - Delete user accounts
  - View user statistics (reviews, check-ins, subscriptions)
- **Subscription Monitoring**: Admins can view all subscriptions, track active/expired status, monitor uploads remaining, and update subscriptions.
- **Transaction & Revenue Tracking**: Admins can:
  - View all transactions
  - Track revenue (total, today, week, month)
  - Monitor transaction statuses
  - View financial statistics

#### 2.1.10 Geocoding & Location Services
- **Address Geocoding**: System converts business addresses to GPS coordinates (latitude/longitude) using geocoding services when Google Places coordinates are not available.
- **Distance Calculation**: System calculates distances between user locations and business locations for check-in verification.
- **Location Verification**: System verifies user proximity to businesses for GPS-based check-ins.

---

### 2.2 User Interface Design

#### 2.2.1 Design System
- **Color Palette**: Cherry Blossom + Light Pink & Dark Green theme
  - Primary Colors: Light Pink (#feb5c6), Dark Green (#2a4421)
  - Background: Soft Mint Green (#d4e6d1), White, Cream (#faf8f3)
  - Accent Colors: Cherry tones (soft, pale, medium)
  - Text Colors: Dark green, dark gray, medium gray, light gray
- **Typography**: Modern, clean fonts with clear hierarchy
- **Layout**: Card-based responsive design with consistent spacing and shadows
- **Components**: Reusable styled components using styled-components library

#### 2.2.2 Main Pages

**Landing Page (PublicHome)**
- Hero section with gradient title "Discover Amazing Hangout Spots"
- Grid layout displaying recent reviews as cards
- Circular business images (180x180px)
- Review cards showing: business name, user, rating, text preview, media thumbnails
- Clean, welcoming design with soft green background

**Login Page**
- Centered card layout on soft green background
- HangoutSpots logo in dark green
- Email and password input fields
- "Forgot password?" link
- "Sign up for free" link
- Error message display

**Signup Page**
- Similar layout to login page
- Form fields: Full name, email, password, confirm password
- Password strength hint
- Success/error message display
- Link to login page

**User Dashboard**
- Fixed sidebar navigation (280px width) with:
  - HangoutSpots logo
  - Navigation items: Dashboard, Submit Review, My Reviews, Browse Spots, Leaderboard, Buy Uploads
  - User profile section
- Main content area with:
  - Personalized greeting with user's name and time-based greeting
  - Three metric cards: Total Reviews, Check-ins, User Points
  - Account Statistics section: Reviews Posted, Check-ins, Likes Received, Businesses Reviewed, Member Since
  - Subscription Overview: Uploads Remaining, Total Spent, Status
  - Achievements and Progress section with badges and level progress
  - Transaction History card
  - My Reservations section

**Submit Review Page**
- Google Places autocomplete search for business selection
- Auto-filled form fields when business is selected:
  - Business name
  - Category (auto-mapped from Google Places types)
  - Address, location, division
  - Contact information
  - Description (from Google editorial summary)
- Manual form fields:
  - Rating (1-5 stars)
  - Review text
  - Media upload (up to 4 files, images/videos)
- Form validation and submission

**Reviews Page**
- Filterable review list (all reviews or user's own reviews)
- Review cards displaying:
  - Business information
  - User information and points
  - Rating stars
  - Review text
  - Media gallery (images/videos)
  - Like count
  - Timestamp
- Empty state with call-to-action for first review

**Business Detail Page**
- Business header with name, category, address
- Business description
- Media gallery
- All reviews for the business
- Check-in button (with GPS verification)
- Reservation modal for booking
- Review submission link

**Leaderboard Page**
- Tab navigation: All-time, Weekly, Monthly
- Ranked user list with:
  - Rank number (medal icons for top 3)
  - User name and avatar
  - Points total
  - Level badge
- Color-coordinated with theme

**Admin Dashboard**
- Tab-based interface:
  - Reported Reviews tab
  - Users Management tab
  - Subscriptions Monitor tab
  - Transactions Monitor tab
- Statistics cards at top of each tab
- Data tables with search and filter capabilities
- Action buttons for management operations

---

### 2.2 Other User Input Preview

#### 2.2.1 Form Inputs

**User Registration Form**
- Full Name: Text input, required
- Email: Email input, required, validated format
- Password: Password input, required, minimum 6 characters
- Confirm Password: Password input, required, must match password

**Login Form**
- Email: Email input, required
- Password: Password input, required

**Review Submission Form**
- Business Search: Autocomplete input with Google Places integration
- Business Name: Text input (auto-filled), required
- Category: Text input (auto-filled), editable
- Address: Text input (auto-filled), required
- Location: Text input (auto-filled)
- Division: Text input (auto-filled)
- Contact: Text input (auto-filled)
- Description: Textarea (auto-filled), editable
- Rating: Star selector (1-5), required
- Review Text: Textarea, required
- Media Files: File input, accepts images/videos, maximum 4 files

**Reservation Form**
- Date: Date picker, required
- Time: Time picker, required
- Number of People: Number input, required, minimum 1
- Special Requests: Textarea, optional

**Subscription Purchase**
- Payment Method: Select dropdown (Mobile Money, Credit Card, etc.)
- Amount: Display only (UGX 2000)
- Confirmation: Button to confirm payment

**Admin User Management**
- Search: Text input for name/email search
- Role Change: Select dropdown (User/Admin)
- Delete: Confirmation button

**Admin Subscription Update**
- Uploads Remaining: Number input
- Expiry Date: Date picker

---

### 2.3 Other User Output Preview

#### 2.3.1 Display Outputs

**Review Cards**
- Business name (clickable link)
- Business category badge
- User name and avatar
- User points display
- Star rating (visual stars)
- Review text (truncated with "read more")
- Media thumbnails (images/videos)
- Like count with icon
- Timestamp (relative or absolute)

**User Profile Card**
- User name
- Current level badge
- Points total
- Progress bar to next level
- Rank number
- Statistics grid:
  - Reviews posted count
  - Check-ins count
  - Likes received count
  - Businesses reviewed count
- Achievement badges display
- Daily points tracker (earned today / remaining / cap)

**Leaderboard Entry**
- Rank number (1, 2, 3 with medal icons)
- User name
- Points total
- Level badge
- Avatar/icon

**Business Detail Display**
- Business name (large heading)
- Category tag
- Full address
- Contact information
- Description text
- Media gallery (grid layout)
- Review count
- Average rating (if available)
- Check-in count

**Subscription Overview Card**
- Status badge (Active/Expired)
- Uploads Remaining: Large number display
- Expiry Date: Formatted date
- Total Spent: Currency formatted (UGX)
- "Buy Uploads" button

**Transaction History**
- Transaction reference number
- Amount (UGX formatted)
- Payment method
- Status badge (Completed/Pending/Failed)
- Date and time
- Transaction type

**Admin Statistics Cards**
- Total Users / Admins / New Users (today/week/month)
- Total Subscriptions / Active / Expired
- Total Revenue / Today / Week / Month
- Total Reported Reviews / Pending Review

**Achievement Badge**
- Badge icon/image
- Achievement name
- Description
- Unlocked date (if applicable)

**Error Messages**
- Red/pink background with border
- Error icon
- Clear error message text
- Action suggestions (if applicable)

**Success Messages**
- Green background with border
- Success icon
- Confirmation message
- Next steps (if applicable)

---

### 2.4 System Database/File Structure Preview

#### 2.4.1 Database Schema

**users Table**
```
- id: INT (Primary Key, Auto Increment)
- name: VARCHAR(255)
- email: VARCHAR(255) (Unique)
- password: VARCHAR(255) (Hashed with bcrypt)
- role: ENUM('user', 'admin') (Default: 'user')
- points: INT (Default: 0)
- level: INT (Default: 1)
- points_today: INT (Default: 0)
- points_reset_date: DATE
- created_at: TIMESTAMP (Default: CURRENT_TIMESTAMP)
```

**businesses Table**
```
- id: INT (Primary Key, Auto Increment)
- name: VARCHAR(255) (Not Null)
- category: VARCHAR(100)
- description: TEXT
- location: VARCHAR(255)
- division: VARCHAR(100)
- address: VARCHAR(500)
- contact: VARCHAR(100)
- latitude: DECIMAL(10, 8)
- longitude: DECIMAL(11, 8)
- place_id: VARCHAR(255) (Google Places ID)
- created_at: TIMESTAMP (Default: CURRENT_TIMESTAMP)
- updated_at: TIMESTAMP (Default: CURRENT_TIMESTAMP ON UPDATE)
```

**reviews Table**
```
- id: INT (Primary Key, Auto Increment)
- user_id: INT (Foreign Key → users.id)
- business_id: INT (Foreign Key → businesses.id)
- rating: INT (1-5)
- text: TEXT
- tags: JSON
- created_at: TIMESTAMP (Default: CURRENT_TIMESTAMP)
- updated_at: TIMESTAMP (Default: CURRENT_TIMESTAMP ON UPDATE)
```

**media Table**
```
- id: INT (Primary Key, Auto Increment)
- business_id: INT (Foreign Key → businesses.id)
- media_url: VARCHAR(255) (Filename)
- media_type: ENUM('image', 'video')
- created_at: TIMESTAMP (Default: CURRENT_TIMESTAMP)
```

**review_likes Table**
```
- id: INT (Primary Key, Auto Increment)
- user_id: INT (Foreign Key → users.id)
- review_id: INT (Foreign Key → reviews.id)
- is_like: TINYINT(1) (1 for like, 0 for dislike)
- created_at: TIMESTAMP (Default: CURRENT_TIMESTAMP)
- updated_at: TIMESTAMP (Default: CURRENT_TIMESTAMP ON UPDATE)
- UNIQUE KEY (user_id, review_id)
```

**review_reports Table**
```
- id: INT (Primary Key, Auto Increment)
- review_id: INT (Foreign Key → reviews.id)
- user_id: INT (Foreign Key → users.id)
- reason: TEXT (Not Null)
- created_at: TIMESTAMP (Default: CURRENT_TIMESTAMP)
- UNIQUE KEY (user_id, review_id)
```

**subscriptions Table**
```
- id: INT (Primary Key, Auto Increment)
- user_id: INT (Foreign Key → users.id)
- uploads_remaining: INT (Default: 10)
- start_date: TIMESTAMP
- expiry_date: TIMESTAMP
- created_at: TIMESTAMP (Default: CURRENT_TIMESTAMP)
```

**transactions Table**
```
- id: INT (Primary Key, Auto Increment)
- user_id: INT (Foreign Key → users.id)
- amount: DECIMAL(10, 2)
- method: VARCHAR(50)
- status: ENUM('pending', 'completed', 'failed') (Default: 'pending')
- transaction_type: VARCHAR(50) (Default: 'subscription')
- transaction_ref: VARCHAR(100) (Unique)
- created_at: TIMESTAMP (Default: CURRENT_TIMESTAMP)
- updated_at: TIMESTAMP (Default: CURRENT_TIMESTAMP ON UPDATE)
```

**checkins Table**
```
- id: INT (Primary Key, Auto Increment)
- user_id: INT (Foreign Key → users.id)
- business_id: INT (Foreign Key → businesses.id)
- created_at: TIMESTAMP (Default: CURRENT_TIMESTAMP)
- UNIQUE KEY (user_id, business_id)
```

**reservations Table**
```
- id: INT (Primary Key, Auto Increment)
- user_id: INT (Foreign Key → users.id)
- business_id: INT (Foreign Key → businesses.id)
- date: DATE (Not Null)
- time: TIME (Not Null)
- people: INT (Not Null)
- special_requests: TEXT
- status: ENUM('pending', 'confirmed', 'rejected', 'completed', 'no-show') (Default: 'pending')
- confirmation_token: VARCHAR(255)
- created_at: TIMESTAMP (Default: CURRENT_TIMESTAMP)
- updated_at: TIMESTAMP (Default: CURRENT_TIMESTAMP ON UPDATE)
```

**user_achievements Table**
```
- id: INT (Primary Key, Auto Increment)
- user_id: INT (Foreign Key → users.id)
- achievement_type: VARCHAR(50) (Not Null)
- awarded_at: TIMESTAMP (Default: CURRENT_TIMESTAMP)
- UNIQUE KEY (user_id, achievement_type)
```

#### 2.4.2 File Structure

**Backend Structure**
```
hangoutspots_backend/
├── app.js (Main Express application)
├── db.js (Database connection)
├── package.json (Dependencies)
├── .env (Environment variables)
├── middleware/
│   ├── authenticateJWT.js (JWT authentication middleware)
│   └── authorizeRole.js (Role-based authorization middleware)
├── routes/
│   ├── users.js (User management endpoints)
│   ├── businesses.js (Business search and details)
│   ├── reviews.js (Review CRUD operations)
│   ├── transactions.js (Transaction processing)
│   ├── subscriptions.js (Subscription management)
│   ├── checkins.js (Check-in system)
│   ├── reservations.js (Reservation system)
│   └── leaderboard.js (Leaderboard rankings)
├── utils/
│   ├── gamification.js (Points, levels, achievements)
│   └── geocoding.js (Address to coordinates conversion)
└── uploads/ (Media file storage directory)
```

**Frontend Structure**
```
hangoutspots_frontend/
├── src/
│   ├── App.jsx (Main application component)
│   ├── main.jsx (Application entry point)
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── PublicHome.jsx (Landing page)
│   │   ├── UserDashboard.jsx
│   │   ├── SubmitReview.jsx
│   │   ├── Reviews.jsx
│   │   ├── BusinessDetail.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── Subscription.jsx
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── UserProfile.jsx
│   │   ├── PurchaseModal.jsx
│   │   ├── TransactionHistory.jsx
│   │   ├── BusinessSearch.jsx
│   │   ├── CheckInButton.jsx
│   │   ├── SubscriptionCard.jsx
│   │   └── admin/
│   │       ├── ReportedReviews.jsx
│   │       ├── UsersManagement.jsx
│   │       ├── SubscriptionsMonitor.jsx
│   │       └── TransactionsMonitor.jsx
│   └── theme/
│       └── colors.js (Color palette definitions)
└── package.json
```

#### 2.4.3 API Endpoints Structure

**Base URL**: `http://localhost:3000`

**Authentication Endpoints** (`/users`)
- `POST /users` - Register new user
- `POST /users/login` - User login
- `GET /users/:id` - Get user info
- `GET /users/:id/profile` - Get user profile with gamification data
- `GET /users/admin/all` - Get all users (admin only)
- `GET /users/admin/stats` - Get user statistics (admin only)
- `PUT /users/admin/:id/role` - Update user role (admin only)
- `DELETE /users/admin/:id` - Delete user (admin only)

**Business Endpoints** (`/businesses`)
- `GET /businesses/search?q=keyword` - Search businesses (Google Places)
- `GET /businesses/places/:placeId` - Get place details (Google Places)
- `GET /businesses` - Get all businesses
- `GET /businesses/:id` - Get business by ID

**Review Endpoints** (`/reviews`)
- `GET /reviews` - Get all reviews with media
- `GET /reviews/search?q=keyword` - **Search reviews by tags** (PUBLIC - no authentication required). Core discovery feature that searches reviews by tag keywords (e.g., "date night", "family places", "group activities"). Returns all matching reviews with business information, sorted by most recent.
- `GET /reviews/:id` - Get single review
- `GET /reviews/business/:businessId` - Get reviews for business
- `GET /reviews/business/name/:businessName` - Get reviews by business name
- `POST /reviews` - Submit new review (authenticated, includes tags field)
- `POST /reviews/:id/react` - Like/unlike review (authenticated)
- `GET /reviews/:id/reactions` - Get reaction counts
- `GET /reviews/reported/all` - Get reported reviews (admin only)
- `DELETE /reviews/:id` - Delete review (authenticated, owner only)
- `POST /reviews/:id/report` - Report review (authenticated)

**Transaction Endpoints** (`/transactions`)
- `POST /transactions` - Create transaction
- `POST /transactions/confirm` - Confirm payment
- `GET /transactions/:id` - Get transaction details
- `GET /transactions/user/:userId` - Get user transactions
- `GET /transactions/admin/all` - Get all transactions (admin only)
- `GET /transactions/admin/stats` - Get transaction statistics (admin only)

**Subscription Endpoints** (`/subscriptions`)
- `GET /subscriptions/user/:userId` - Get user subscription
- `GET /subscriptions/:userId/status` - Check subscription status
- `GET /subscriptions/admin/all` - Get all subscriptions (admin only)
- `GET /subscriptions/admin/stats` - Get subscription statistics (admin only)
- `PUT /subscriptions/admin/:id` - Update subscription (admin only)

**Check-in Endpoints** (`/checkins`)
- `POST /checkins` - Create check-in (authenticated, GPS verified)
- `GET /checkins/user/:userId` - Get user check-ins
- `GET /checkins/business/:businessId` - Get business check-ins
- `GET /checkins/stats/:userId` - Get check-in statistics

**Reservation Endpoints** (`/reservations`)
- `POST /reservations` - Create reservation (authenticated)
- `GET /reservations/user/:userId` - Get user reservations
- `GET /reservations/business/:businessId` - Get business reservations (admin only)
- `PUT /reservations/:id/status` - Update reservation status (admin only)

**Leaderboard Endpoints** (`/leaderboard`)
- `GET /leaderboard/all-time` - All-time rankings
- `GET /leaderboard/weekly` - Weekly rankings
- `GET /leaderboard/monthly` - Monthly rankings

---

### 2.5 External and Internal Limitations and Restrictions

#### 2.5.1 External Limitations

**Google Places API**
- **API Key Required**: System requires a valid Google Places API key configured in environment variables
- **API Quota Limits**: Google Places API has usage quotas and billing limits that may restrict:
  - Number of autocomplete requests per day
  - Number of details requests per day
  - Cost per request (billing applies)
- **Geographic Restrictions**: Currently configured to search within Uganda (`country:ug`). Can be modified for global search.
- **Data Availability**: Not all businesses may have complete information (editorial summaries, contact details, etc.)
- **Rate Limiting**: Google API may rate limit requests if quota is exceeded

**Internet Connectivity**
- **Required for Business Search**: Google Places API requires active internet connection
- **Required for Geocoding**: Address-to-coordinates conversion requires internet access
- **Offline Functionality**: Limited - users can view cached data but cannot search new businesses or submit reviews without internet

**Browser Compatibility**
- **GPS Location Access**: Check-in GPS verification requires browser geolocation API support
- **File Upload**: Media upload requires modern browser with File API support
- **JavaScript Required**: Frontend is a React SPA requiring JavaScript enabled

**Payment Processing**
- **Manual Confirmation**: Current system requires manual payment confirmation (no integrated payment gateway)
- **Payment Method Support**: Limited to predefined payment methods (Mobile Money, Credit Card)
- **Currency**: Fixed to UGX (Uganda Shillings)

#### 2.5.2 Internal Limitations

**File Storage**
- **Storage Capacity**: Media files stored on server filesystem - limited by server disk space
- **File Size Limits**: No explicit file size validation (relies on multer defaults)
- **File Type Validation**: Accepts images and videos but no format-specific validation
- **No CDN**: Media files served directly from server (no content delivery network)

**Database Constraints**
- **MySQL Dependency**: System requires MySQL database (version compatibility not specified)
- **Connection Limits**: Database connection pool limits may restrict concurrent users
- **Query Performance**: Complex queries (leaderboards, statistics) may slow with large datasets
- **No Database Replication**: Single database instance (no failover)

**Authentication & Security**
- **JWT Token Expiry**: Tokens expire after 1 hour requiring re-authentication
- **Password Requirements**: Minimum 6 characters (relatively weak)
- **No Two-Factor Authentication**: Standard email/password only
- **No Account Recovery**: No "forgot password" functionality implemented
- **Session Management**: Client-side token storage (localStorage) - vulnerable to XSS

**Gamification Limits**
- **Daily Point Cap**: 500 points per day maximum
- **Review Frequency**: One review per business per 7 days
- **Check-in Frequency**: One check-in per business per 24 hours
- **Self-Like Prevention**: Users cannot like their own reviews

**Subscription Limits**
- **Upload Credits**: 5 uploads per subscription purchase
- **Subscription Duration**: 30 days per subscription
- **No Auto-Renewal**: Subscriptions do not auto-renew
- **No Refunds**: No refund mechanism for unused uploads

**Media Limitations**
- **Maximum Files**: 4 media files per review
- **No Image Processing**: No resizing, compression, or optimization
- **No Video Processing**: Videos stored as-is (no transcoding)
- **No Thumbnail Generation**: Full-size images used for thumbnails

**User Role Restrictions**
- **Admin Creation**: No self-service admin account creation (must be manually set in database)
- **Role Changes**: Only admins can change user roles
- **Account Deletion**: Users cannot delete their own accounts (admin only)

**Data Validation**
- **Input Sanitization**: Limited input validation and sanitization
- **SQL Injection Protection**: Uses parameterized queries but no additional sanitization
- **XSS Protection**: No explicit XSS protection in user-generated content
- **File Upload Security**: No virus scanning or malicious file detection

**Performance Limitations**
- **No Caching**: No caching layer for frequently accessed data
- **No Load Balancing**: Single server instance
- **Synchronous Operations**: Many database operations are synchronous
- **No Background Jobs**: All operations are request-response based

**Scalability Constraints**
- **Single Server**: Application runs on single server (no horizontal scaling)
- **File Storage**: Local filesystem storage (not cloud-based)
- **Database**: Single MySQL instance (no sharding or replication)
- **Session Storage**: Client-side only (no shared session store)

**Feature Limitations**
- **No Email Notifications**: System does not send email notifications
- **No Push Notifications**: No mobile push notification support
- **No Social Sharing**: No integration with social media platforms
- **No Business Verification**: No process to verify business ownership
- **No Review Editing**: Users cannot edit reviews after submission (only delete)
- **No Review Replies**: Businesses cannot reply to reviews
- **No Advanced Search**: Basic search only (no filters, sorting options)
- **No Favorites/Bookmarks**: Users cannot save favorite businesses
- **No Follow System**: Users cannot follow other users

---

### 2.6 User Interface Specification

#### 2.6.1 Interface Metaphor Model

The HangoutSpots platform uses a **Social Discovery & Review Platform** metaphor, similar to popular review and social platforms. The interface design follows these conceptual models:

**Card-Based Discovery**
- Businesses and reviews are presented as cards, similar to social media feeds
- Each card contains complete information in a scannable format
- Cards support visual browsing and quick decision-making

**Dashboard Hub**
- User dashboard serves as a personal command center
- Fixed sidebar navigation provides persistent access to all features
- Main content area displays contextual information and actions

**Progressive Disclosure**
- Information is revealed progressively (e.g., review text truncation with "read more")
- Forms auto-fill to reduce user input burden
- Advanced features (admin functions) are hidden from regular users

**Gamification Integration**
- Points, levels, and achievements are prominently displayed
- Progress indicators show advancement toward goals
- Leaderboards create competitive engagement

**Search-First Approach**
- Business search is the primary entry point for content creation
- Autocomplete provides instant feedback
- Search results integrate seamlessly with form completion

**Visual Hierarchy**
- Important actions (Submit Review, Buy Uploads) are prominently placed
- Status indicators (subscription status, points) use color coding
- Navigation follows standard web patterns (top nav, sidebar)

#### 2.6.2 User Screens/Dialog

**Screen 1: Landing Page (PublicHome)**
- **Purpose**: Display recent reviews to all visitors
- **Layout**: Full-width hero section + grid of review cards
- **Components**:
  - Hero title: "Discover Amazing Hangout Spots" (gradient text)
  - Subtitle: Welcoming message
  - Review grid: 2-3 columns (responsive)
  - Each card: Business image (circular), name, user, rating, text preview, media thumbnails
- **Navigation**: Navbar with Login/Signup links
- **Actions**: Click business name → Business detail page, Click review → Full review view

**Screen 2: Search Page (Tag-Based Discovery)**
- **Purpose**: Core discovery feature - search for hangout spots by tags/moods/keywords
- **Layout**: Search bar + results grid/list
- **Components**:
  - Large search input: Placeholder "What are you looking for? (e.g., date night, family places, group activities)"
  - Search suggestions/hints: Popular tags displayed as chips
  - Results count: "Found X results for 'search term'"
  - Results grid: Review cards showing matching businesses
  - Each card: Business name, Category, Tags (highlighted), Rating, User, Text preview, Media thumbnail
  - Empty state: "No results found. Try different keywords like 'romantic', 'family friendly', 'outdoor'"
- **Access**: Available to all users (no authentication required)
- **Actions**: Click business name → Business detail, Click review card → View full review, Type search → Real-time results
- **Search Examples**: "date night", "family friendly", "group activities", "romantic", "quiet", "outdoor", "kids", "nightlife"

**Screen 3: Login Dialog**
- **Purpose**: Authenticate existing users
- **Layout**: Centered modal card (450px max-width)
- **Components**:
  - Logo: "HangoutSpots" text
  - Title: "Welcome back!"
  - Subtitle: "Login to discover and share amazing places"
  - Form: Email input, Password input, "Forgot password?" link
  - Submit button: "Login" (full-width)
  - Divider: "or"
  - Signup link: "Don't have an account? Sign up for free"
- **Validation**: Real-time email format, required fields
- **Error Display**: Red error message above form
- **Success Action**: Redirect to dashboard (user) or admin panel (admin)

**Screen 4: Signup Dialog**
- **Purpose**: Register new users
- **Layout**: Centered modal card (450px max-width)
- **Components**:
  - Logo: "HangoutSpots" text
  - Title: "Create an account"
  - Subtitle: "Join our community and start discovering amazing places"
  - Form: Full name, Email, Password, Confirm password
  - Password hint: "Must be at least 6 characters"
  - Submit button: "Sign Up"
  - Divider: "or"
  - Login link: "Already have an account? Login"
- **Validation**: Password match, minimum length, email format
- **Success Action**: Show success message, redirect to login after 2 seconds

**Screen 5: User Dashboard**
- **Purpose**: Personal hub for user activity and information
- **Layout**: Fixed sidebar (280px) + scrollable main content
- **Sidebar Components**:
  - Logo with icon
  - Navigation menu: Dashboard, Submit Review, My Reviews, Browse Spots, Leaderboard, Buy Uploads
  - User profile section (bottom)
- **Main Content Components**:
  - Greeting: "Good [morning/afternoon/evening], [User Name]!"
  - Three metric cards: Total Reviews, Check-ins, User Points
  - Account Statistics section: Grid with 5 stats (Reviews Posted, Check-ins, Likes Received, Businesses Reviewed, Member Since)
  - Subscription Overview card: Uploads remaining, Total spent, Status, "Buy Uploads" button
  - Achievements and Progress section: Level progress bar, achievement badges
  - Transaction History card: List of recent transactions
  - My Reservations section: Upcoming reservations list
- **Actions**: Click nav items → Navigate to pages, Click "Buy Uploads" → Open purchase modal

**Screen 6: Submit Review Form**
- **Purpose**: Create new business review
- **Layout**: Full-width form with sections
- **Components**:
  - Business Search: Autocomplete input with dropdown results
  - Auto-filled fields (when business selected): Name, Category, Address, Location, Division, Contact, Description
  - Manual fields: Rating (star selector), Review text (textarea), Media upload (file input, max 4)
  - Submit button: "Submit Review"
- **Validation**: Business name required, Rating required, Review text required
- **Success Action**: Show points earned, achievements unlocked, redirect to reviews page

**Screen 7: Reviews List Page**
- **Purpose**: Display all reviews or filtered user reviews
- **Layout**: List of review cards
- **Components**:
  - Filter badge: "Showing X reviews" (if filtered)
  - Review cards: Business info, User info, Rating stars, Text, Media gallery, Like count, Timestamp
  - Empty state: "No reviews yet" with "Submit Your First Review" button
- **Actions**: Click business name → Business detail, Click like → Toggle like, Click media → View full size

**Screen 8: Business Detail Page**
- **Purpose**: Show complete business information and all reviews
- **Layout**: Header + content sections
- **Components**:
  - Business header: Name (large), Category badge, Address, Contact
  - Description section: Business description text
  - Media gallery: Grid of images/videos
  - Check-in button: "Check In" (with GPS verification)
  - Reserve button: "Make Reservation" (opens modal)
  - Reviews section: All reviews for this business
- **Actions**: Check-in → Verify GPS, Reserve → Open reservation modal, View reviews → Scroll to reviews

**Screen 9: Leaderboard Page**
- **Purpose**: Display user rankings
- **Layout**: Tabbed interface + ranked list
- **Components**:
  - Tabs: All-time, Weekly, Monthly
  - Ranked list: Rank number (medal icons for top 3), User name, Points, Level badge
- **Actions**: Switch tabs → Filter rankings by time period

**Screen 10: Admin Dashboard**
- **Purpose**: Administrative control panel
- **Layout**: Tabbed interface with data tables
- **Tabs**:
  - Reported Reviews: Table with review content, report count, reasons, reporting users, Delete/Dismiss actions
  - Users Management: Table with user details, Search input, Role dropdown, Delete button, Statistics cards
  - Subscriptions Monitor: Table with subscription details, Status badges, Statistics cards
  - Transactions Monitor: Table with transaction details, Revenue statistics cards
- **Actions**: Search, Filter, Update status, Delete items

**Screen 11: Purchase Modal (Dialog)**
- **Purpose**: Buy subscription uploads
- **Layout**: Centered modal overlay
- **Components**:
  - Title: "Buy Uploads"
  - Package info: "5 Uploads - UGX 2,000"
  - Payment method selector: Dropdown
  - Amount display: "Total: UGX 2,000"
  - Confirm button: "Confirm Purchase"
  - Cancel button: "Cancel"
- **Success Action**: Update subscription, show success message, close modal

**Screen 12: Reservation Modal (Dialog)**
- **Purpose**: Create business reservation
- **Layout**: Centered modal overlay
- **Components**:
  - Title: "Make a Reservation"
  - Business name display
  - Date picker
  - Time picker
  - People selector (number input)
  - Special requests (textarea, optional)
  - Submit button: "Submit Reservation"
  - Cancel button: "Cancel"
- **Success Action**: Show confirmation, close modal, update reservations list

#### 2.6.3 Report Formats/Sample Data

**Sample Review Data Output**
```json
{
  "id": 123,
  "user_id": 45,
  "username": "John Doe",
  "points": 1250,
  "rating": 5,
  "text": "Amazing place! Great food and excellent service. Highly recommend!",
  "tags": ["date night", "romantic", "quiet", "good food"],
  "created_at": "2025-01-15T10:30:00.000Z",
  "updated_at": "2025-01-15T10:30:00.000Z",
  "business": {
    "name": "Cafe Javas",
    "division": "Kampala",
    "category": "Cafe",
    "address": "Acacia Avenue, Kololo"
  },
  "media": [
    {
      "id": 56,
      "url": "1749397120265-cafe.jpeg",
      "type": "image"
    },
    {
      "id": 57,
      "url": "1749397120265-food.mp4",
      "type": "video"
    }
  ],
  "likes": 12,
  "dislikes": 0
}
```

**Sample Tag-Based Search Results Output**
```json
{
  "query": "date night",
  "results_count": 3,
  "reviews": [
    {
      "id": 123,
      "user_id": 45,
      "username": "John Doe",
      "points": 1250,
      "rating": 5,
      "text": "Perfect for a romantic date night! The ambiance is amazing.",
      "tags": ["date night", "romantic", "quiet", "good food"],
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z",
      "business": {
        "id": 5,
        "name": "Cafe Javas",
        "division": "Kampala",
        "category": "Cafe",
        "address": "Acacia Avenue, Kololo",
        "description": "Popular breakfast spot with great atmosphere"
      },
      "media": [
        {
          "id": 56,
          "url": "1749397120265-cafe.jpeg",
          "type": "image"
        }
      ],
      "likes": 12,
      "dislikes": 0
    },
    {
      "id": 124,
      "user_id": 46,
      "username": "Jane Smith",
      "points": 890,
      "rating": 4,
      "text": "Great place for a date night! Food was delicious.",
      "tags": ["date night", "romantic", "family friendly"],
      "created_at": "2025-01-14T18:00:00.000Z",
      "updated_at": "2025-01-14T18:00:00.000Z",
      "business": {
        "id": 8,
        "name": "The Garden Restaurant",
        "division": "Kampala",
        "category": "Restaurant",
        "address": "Lugogo Mall",
        "description": "Beautiful outdoor dining experience"
      },
      "media": [],
      "likes": 5,
      "dislikes": 0
    }
  ]
}
```

**Sample User Profile Data Output**
```json
{
  "user": {
    "id": 45,
    "name": "John Doe",
    "email": "john@example.com",
    "points": 1250,
    "level": {
      "current": 3,
      "points": 1250,
      "next_level": 4,
      "points_needed": 250,
      "progress_percentage": 75
    },
    "rank": 15,
    "member_since": "2024-06-01T00:00:00.000Z"
  },
  "stats": {
    "reviews": 25,
    "checkins": 18,
    "likes_received": 45,
    "businesses_reviewed": 20
  },
  "achievements": [
    {
      "type": "first_review",
      "name": "First Review",
      "description": "Submitted your first review",
      "awarded_at": "2024-06-05T12:00:00.000Z"
    },
    {
      "type": "level_3",
      "name": "Level 3 Explorer",
      "description": "Reached Level 3",
      "awarded_at": "2024-12-20T14:30:00.000Z"
    }
  ],
  "daily_limit": {
    "points_earned_today": 150,
    "points_remaining_today": 350,
    "cap": 500
  }
}
```

**Sample Leaderboard Data Output**
```json
[
  {
    "rank": 1,
    "user_id": 12,
    "name": "Alice Smith",
    "points": 5420,
    "level": 5
  },
  {
    "rank": 2,
    "user_id": 8,
    "name": "Bob Johnson",
    "points": 4890,
    "level": 5
  },
  {
    "rank": 3,
    "user_id": 23,
    "name": "Charlie Brown",
    "points": 4320,
    "level": 4
  }
]
```

**Sample Transaction Data Output**
```json
{
  "id": 789,
  "user_id": 45,
  "amount": 2000.00,
  "method": "Mobile Money",
  "status": "completed",
  "transaction_type": "subscription",
  "transaction_ref": "TXN-1736942400000-A1B2C3D4",
  "created_at": "2025-01-15T08:00:00.000Z",
  "updated_at": "2025-01-15T08:05:00.000Z"
}
```

**Sample Subscription Data Output**
```json
{
  "id": 34,
  "user_id": 45,
  "uploads_remaining": 3,
  "start_date": "2025-01-01T00:00:00.000Z",
  "expiry_date": "2025-01-31T23:59:59.000Z",
  "status": "active"
}
```

**Sample Admin Statistics Output**
```json
{
  "users": {
    "total_users": 1250,
    "admin_count": 3,
    "regular_users": 1247,
    "new_today": 12,
    "new_this_week": 85,
    "new_this_month": 320
  },
  "subscriptions": {
    "total_subscriptions": 890,
    "active_subscriptions": 650,
    "expired_subscriptions": 240,
    "avg_uploads_remaining": 2.5,
    "total_uploads_remaining": 1625
  },
  "transactions": {
    "total_transactions": 1200,
    "completed_transactions": 1150,
    "pending_transactions": 45,
    "failed_transactions": 5,
    "total_revenue": 2300000.00,
    "today_revenue": 40000.00,
    "week_revenue": 280000.00,
    "month_revenue": 1200000.00
  },
  "reported_reviews": {
    "total_reported": 23,
    "pending_review": 8
  }
}
```

#### 2.6.4 On-line Help Material

**Contextual Help Tooltips**
- **Business Search**: "Start typing to search for businesses using Google Places"
- **Rating Stars**: "Click stars to rate your experience (1-5)"
- **Media Upload**: "Upload up to 4 images or videos (max size: 10MB each)"
- **Check-in Button**: "Check in to earn 10 points. You must be within 500m of the business."
- **Subscription Status**: "Active subscriptions allow you to submit reviews. Each review uses 1 upload credit."

**Form Field Help Text**
- **Password Field**: "Must be at least 6 characters"
- **Confirm Password**: "Re-enter your password to confirm"
- **Review Text**: "Share your experience with this business"
- **Special Requests**: "Any dietary restrictions or special requirements?"

**Empty State Messages**
- **No Reviews**: "No reviews yet. Be the first to review this business!"
- **No Subscriptions**: "You don't have an active subscription. Buy uploads to start reviewing!"
- **No Check-ins**: "You haven't checked in anywhere yet. Visit a business and check in to earn points!"
- **No Achievements**: "Complete actions to unlock achievements!"

**Information Messages**
- **Points Earned**: "You earned 20 points for this review!"
- **Achievement Unlocked**: "Achievement unlocked: First Review!"
- **Subscription Active**: "Your subscription is active until [date]"
- **Daily Limit**: "You've earned 150/500 points today"

**Navigation Help**
- **Sidebar Tooltips**: Hover over nav items to see descriptions
- **Breadcrumbs**: Not implemented (future enhancement)

**Error Recovery Help**
- **GPS Check-in Failed**: "You're too far from this business. Please get within 500m to check in."
- **Upload Failed**: "No uploads remaining. Please purchase a subscription."
- **Review Frequency**: "You can only review this business once every 7 days. Last review: [date]"

#### 2.6.5 Error Conditions and System Messages

**Authentication Errors**
- **Invalid Credentials**: "Invalid email or password. Please try again."
- **Token Expired**: "Your session has expired. Please log in again."
- **Unauthorized Access**: "You don't have permission to access this resource."
- **Account Not Found**: "No account found with this email address."

**Validation Errors**
- **Required Field Missing**: "[Field name] is required."
- **Invalid Email Format**: "Please enter a valid email address."
- **Password Mismatch**: "Passwords do not match."
- **Password Too Short**: "Password must be at least 6 characters long."
- **Invalid Rating**: "Please select a rating between 1 and 5 stars."
- **File Too Large**: "File size exceeds maximum limit."
- **Too Many Files**: "Maximum 4 files allowed per review."

**Business Search Errors**
- **No Results**: "No businesses found. Try a different search term."
- **API Error**: "Search temporarily unavailable. Please try again later."
- **Network Error**: "Unable to connect to search service. Check your internet connection."

**Review Submission Errors**
- **No Subscription**: "No uploads left. Please renew your subscription."
- **Review Frequency Limit**: "You can only review this business once every 7 days. Last review: [date]"
- **Business Required**: "Please select or enter a business name."
- **Media Upload Failed**: "Failed to upload media. Please try again."

**Check-in Errors**
- **Too Far Away**: "You are too far from this business to check in. Distance: [X]m. Required: 500m."
- **GPS Not Available**: "Location services unavailable. Please enable GPS and try again."
- **Frequency Limit**: "You can only check in once per 24 hours. Next check-in available: [time]."
- **Business Not Found**: "Business not found."

**Transaction Errors**
- **Invalid Amount**: "Invalid amount. Subscription is UGX 2,000."
- **Transaction Failed**: "Payment processing failed. Please try again."
- **Already Completed**: "This transaction has already been completed."
- **Transaction Not Found**: "Transaction not found."

**Subscription Errors**
- **No Subscription**: "No subscription found. Please purchase a subscription."
- **Subscription Expired**: "Your subscription has expired. Please renew to continue."
- **No Uploads Remaining**: "No uploads remaining. Please purchase more uploads."

**Server Errors**
- **Database Error**: "Database error occurred. Please try again later."
- **Server Error**: "Something went wrong! Please try again."
- **Service Unavailable**: "Service temporarily unavailable. Please try again later."

**Success Messages**
- **Login Success**: "Login successful! Redirecting..."
- **Registration Success**: "Account created successfully! Redirecting to login..."
- **Review Submitted**: "Review submitted successfully! You earned [X] points!"
- **Check-in Success**: "Check-in successful! You earned 10 points!"
- **Payment Confirmed**: "Payment confirmed! Your subscription has been updated."
- **Reservation Created**: "Reservation request submitted successfully!"

**Warning Messages**
- **GPS Verification Skipped**: "Check-in allowed without GPS verification."
- **Business Has No Coordinates**: "This business has no GPS coordinates. Check-in allowed without verification."

#### 2.6.6 Control Functions

**Navigation Controls**
- **Sidebar Navigation**: Click menu items to navigate between pages
- **Breadcrumbs**: Not implemented (future enhancement)
- **Back Button**: Browser back button supported
- **Logo Click**: Returns to landing page (if logged out) or dashboard (if logged in)

**Form Controls**
- **Submit Button**: Submits form data, shows loading state during processing
- **Cancel Button**: Closes modal or returns to previous page
- **Reset Button**: Not implemented (future enhancement)
- **Auto-save**: Not implemented (future enhancement)

**Search Controls**
- **Autocomplete Input**: Real-time search as user types (300ms debounce)
- **Dropdown Selection**: Click result to select and auto-fill form
- **Clear Search**: Click X icon to clear search input
- **Keyboard Navigation**: Arrow keys to navigate results, Enter to select (future enhancement)

**Media Controls**
- **File Upload**: Click to open file picker, select up to 4 files
- **File Preview**: Thumbnail preview after selection
- **Remove File**: Click X on preview to remove file before submission
- **Media Viewer**: Click media on review cards to view full size (future enhancement)

**Review Controls**
- **Like Button**: Click to like/unlike review (heart icon)
- **Report Button**: Click to report inappropriate review (flag icon)
- **Delete Button**: Click to delete own review (trash icon, owner only)
- **Edit Button**: Not implemented (future enhancement)

**Filtering Controls**
- **Review Filter**: Toggle between "All Reviews" and "My Reviews"
- **Leaderboard Tabs**: Click tabs to switch between All-time/Weekly/Monthly
- **Admin Search**: Type in search box to filter users/transactions

**Modal Controls**
- **Open Modal**: Click trigger button (e.g., "Buy Uploads", "Make Reservation")
- **Close Modal**: Click X button, Cancel button, or click outside modal
- **Modal Overlay**: Dark overlay blocks interaction with background

**Pagination Controls**
- **Not Implemented**: Currently displays all results (future enhancement for large datasets)

**Sorting Controls**
- **Default Sorting**: Reviews by creation date (newest first)
- **Custom Sorting**: Not implemented (future enhancement)

**Action Controls**
- **Confirm Actions**: Delete operations show confirmation dialog
- **Undo Actions**: Not implemented (future enhancement)
- **Bulk Actions**: Not implemented (future enhancement for admin)

---

### 3. System Performance Requirements

#### 3.1 Efficiency (Speed, Size, Peripheral Device Usage)

**Response Time Requirements**
- **Page Load Time**: Initial page load should complete within 2-3 seconds on standard broadband connection
- **API Response Time**: 
  - Authentication endpoints: < 500ms
  - Business search (Google Places): < 2 seconds (depends on API)
  - Review submission: < 1 second
  - Database queries: < 500ms for simple queries, < 2 seconds for complex queries
- **Form Submission**: Review submission should process within 1-2 seconds
- **Media Upload**: File upload progress should be visible, completion within 5-10 seconds for typical image sizes

**Database Performance**
- **Query Optimization**: All queries use indexed columns (user_id, business_id, review_id)
- **Connection Pooling**: MySQL connection pool manages concurrent database connections
- **Query Timeout**: Default MySQL timeout applies (typically 30 seconds)

**File Storage Efficiency**
- **Media File Size**: No explicit size limits enforced (relies on multer defaults)
- **Storage Location**: Local filesystem (`/uploads` directory)
- **File Serving**: Static file serving via Express middleware
- **No Compression**: Images/videos stored as-is (no automatic compression)

**Memory Usage**
- **Server Memory**: Node.js application typically uses 50-200MB RAM depending on load
- **Database Memory**: MySQL memory usage depends on data size and query complexity
- **Client Memory**: React application bundle size ~500KB-1MB (gzipped)

**Network Efficiency**
- **API Calls**: RESTful API minimizes redundant data transfer
- **Media Loading**: Images loaded on-demand (lazy loading not implemented)
- **Caching**: No HTTP caching headers set (future enhancement)

**Peripheral Device Usage**
- **GPS/Location Services**: Required for check-in GPS verification
- **Camera/Gallery Access**: Required for media upload (mobile devices)
- **File System Access**: Required for file uploads

#### 3.2 Reliability

##### 3.2.1 Description of Reliability Measures

**Accuracy**
- **Data Integrity**: Database foreign key constraints ensure referential integrity
- **Input Validation**: Form validation prevents invalid data entry
- **Coordinate Accuracy**: GPS coordinates stored with 8 decimal places precision (latitude) and 11 decimal places (longitude)
- **Transaction Accuracy**: Financial transactions use unique reference numbers to prevent duplicates

**Precision**
- **Points Calculation**: Integer-based point system ensures precise calculations
- **Rating System**: 1-5 star rating system with integer values
- **Date/Time**: Timestamps stored in UTC, converted to local time for display

**Consistency**
- **Database Transactions**: Critical operations (subscription updates, point awards) use database transactions where applicable
- **State Management**: Client-side state management ensures UI consistency
- **API Responses**: Consistent JSON response format across all endpoints

**Reproducibility**
- **Deterministic Operations**: Point calculations, level assignments follow fixed algorithms
- **Idempotent Operations**: API endpoints designed to be idempotent where possible
- **Logging**: Server-side logging enables issue reproduction

##### 3.2.2 Error/Failure Detection and Recovery

**Failure Modes**

1. **Database Connection Failure**
   - **Detection**: Connection error logged, API returns 500 status
   - **Consequences**: All database-dependent operations fail
   - **Recovery**: Automatic reconnection on next request (MySQL connection pool)
   - **Manual Recovery**: Restart server if connection pool exhausted

2. **Google Places API Failure**
   - **Detection**: API error response logged, empty results returned
   - **Consequences**: Business search unavailable, users can manually enter business info
   - **Recovery**: Automatic retry not implemented, user must retry manually
   - **Fallback**: Manual business entry still available

3. **File Upload Failure**
   - **Detection**: Multer error caught, error message returned to client
   - **Consequences**: Review submission fails if media upload fails
   - **Recovery**: User must retry upload
   - **Prevention**: File size/type validation (future enhancement)

4. **Authentication Token Expiry**
   - **Detection**: JWT verification fails, 401 status returned
   - **Consequences**: User session invalidated, redirected to login
   - **Recovery**: User must re-authenticate
   - **Prevention**: Token refresh mechanism (future enhancement)

5. **GPS Location Unavailable**
   - **Detection**: Browser geolocation API error
   - **Consequences**: Check-in proceeds without GPS verification
   - **Recovery**: User can retry with GPS enabled
   - **Fallback**: Check-in allowed without verification

6. **Subscription Expiry**
   - **Detection**: Subscription status checked on review submission
   - **Consequences**: Review submission blocked if no active subscription
   - **Recovery**: User must purchase new subscription
   - **Prevention**: Expiry warnings (future enhancement)

**Error Logging and Reporting**
- **Server Logs**: All errors logged to console with timestamps
- **Error Messages**: User-friendly error messages returned to client
- **No External Logging**: No integration with external logging services (e.g., Sentry, Loggly)
- **No Error Analytics**: No error tracking/analytics system

**Manual Recovery Procedures**
- **Database Issues**: Admin can restart MySQL service, check connection settings
- **Server Crashes**: Admin must restart Node.js application
- **File System Issues**: Admin must check disk space, file permissions
- **API Key Issues**: Admin must verify Google Places API key in `.env` file

**Automatic Recovery Procedures**
- **Database Reconnection**: MySQL connection pool automatically reconnects
- **No Automatic Retries**: Failed API calls not automatically retried
- **No Health Checks**: No automatic health monitoring or restart mechanisms

##### 3.2.3 Allowable/Acceptable Error/Failure Rate

**Target Reliability Metrics**
- **Uptime Target**: 99% uptime (approximately 7.2 hours downtime per month)
- **API Success Rate**: > 95% successful API responses
- **Database Availability**: > 99.5% database connection success rate
- **File Upload Success**: > 98% successful file uploads

**Acceptable Failure Rates**
- **Authentication Failures**: < 1% of login attempts (excluding invalid credentials)
- **Review Submission Failures**: < 2% of submission attempts
- **Check-in Failures**: < 5% (higher due to GPS dependency)
- **Payment Processing Failures**: < 1% of transactions

**Error Tolerance**
- **Non-Critical Errors**: Business search failures acceptable (manual entry available)
- **Critical Errors**: Authentication, payment, and data storage errors must be minimal
- **Degraded Service**: System should continue operating with reduced functionality if non-critical services fail

#### 3.3 Security

##### 3.3.1 Hardware Security

**Server Security**
- **Physical Security**: Server hosting environment should have restricted physical access
- **Network Security**: Server should be behind firewall, only necessary ports exposed (HTTP/HTTPS)
- **No Hardware-Specific Requirements**: Application does not require specific hardware security features

**Client Device Security**
- **No Hardware Requirements**: Application does not require specific hardware security features
- **GPS Access**: Requires user permission for location services

##### 3.3.2 Software Security

**Application Security**
- **Dependency Management**: Regular dependency updates recommended to patch vulnerabilities
- **Input Sanitization**: Limited input sanitization (basic validation only)
- **SQL Injection Protection**: Parameterized queries prevent SQL injection
- **XSS Protection**: No explicit XSS protection (relies on React's default escaping)
- **CSRF Protection**: No CSRF tokens implemented (future enhancement)

**Authentication Security**
- **Password Hashing**: Passwords hashed using bcrypt with salt rounds (10)
- **JWT Tokens**: Tokens signed with secret key, expire after 1 hour
- **Token Storage**: Tokens stored in localStorage (vulnerable to XSS)
- **No Password Reset**: No password recovery mechanism

**API Security**
- **Rate Limiting**: No rate limiting implemented (future enhancement)
- **CORS Configuration**: CORS enabled for specific origin (http://localhost:5173)
- **No API Versioning**: No API versioning strategy

##### 3.3.3 Data Security

**Data Encryption**
- **Data in Transit**: No HTTPS enforcement (development environment)
- **Data at Rest**: Database passwords and sensitive data not encrypted at rest
- **Environment Variables**: Sensitive data (API keys, database credentials) stored in `.env` file (not committed to version control)

**Data Privacy**
- **User Data**: User data stored in database, accessible to admins
- **No Data Anonymization**: No data anonymization for deleted accounts
- **No GDPR Compliance**: No explicit GDPR compliance measures
- **Media Files**: Uploaded media files stored on server, accessible via URL

**Data Backup**
- **No Automated Backups**: No automated database backup system
- **Manual Backups**: Admins must perform manual database backups
- **No Backup Retention Policy**: No defined backup retention strategy

##### 3.3.4 Execution Security (User Validation)

**User Authentication**
- **Login Validation**: Email and password validated against database
- **JWT Verification**: All protected routes verify JWT token
- **Token Expiry**: Tokens expire after 1 hour, users must re-authenticate

**Role-Based Access Control**
- **Role Verification**: Middleware verifies user role before allowing admin operations
- **User ID Validation**: Users can only access their own data (with admin override)
- **Admin Privileges**: Admin role grants access to all user data and administrative functions

**Action Authorization**
- **Review Ownership**: Users can only delete their own reviews
- **Self-Like Prevention**: Users cannot like their own reviews
- **Subscription Access**: Users can only view their own subscriptions
- **Transaction Access**: Users can only view their own transactions

**Input Validation**
- **Form Validation**: Client-side and server-side validation for required fields
- **File Type Validation**: Basic file type checking (mime type)
- **No File Content Scanning**: No virus/malware scanning of uploaded files

#### 3.4 Maintainability

**Code Organization**
- **Modular Structure**: Code organized into routes, middleware, utilities, components
- **Separation of Concerns**: Business logic separated from presentation
- **Naming Conventions**: Consistent naming conventions for files and functions

**Documentation**
- **Code Comments**: Limited inline comments
- **API Documentation**: This specification document
- **No Auto-Generated Docs**: No Swagger/OpenAPI documentation

**Testing**
- **No Test Suite**: No unit tests, integration tests, or end-to-end tests
- **Manual Testing**: Functionality verified through manual testing
- **No Test Coverage Metrics**: No code coverage tracking

**Version Control**
- **Git Repository**: Code stored in Git repository
- **No Branching Strategy**: No defined branching strategy documented
- **No Release Process**: No formal release/deployment process

**Dependency Management**
- **Package Management**: npm for Node.js dependencies
- **Dependency Updates**: Manual updates required
- **No Dependency Scanning**: No automated vulnerability scanning

#### 3.5 Modifiability

**Configuration Management**
- **Environment Variables**: Configuration via `.env` file (database, API keys, JWT secret)
- **No Configuration UI**: No admin interface for configuration changes
- **Hard-coded Values**: Some values hard-coded (e.g., subscription price: UGX 2000)

**Feature Flags**
- **No Feature Flags**: No feature flag system for gradual rollouts
- **Code-Based Toggles**: Features enabled/disabled via code changes

**Database Schema Changes**
- **Migration System**: No database migration system (manual SQL scripts)
- **Schema Versioning**: No schema version tracking
- **Backward Compatibility**: No explicit backward compatibility guarantees

**API Modifications**
- **No Versioning**: API changes may break existing clients
- **No Deprecation Policy**: No process for deprecating old endpoints

**UI Modifications**
- **Component-Based**: React components allow easy UI modifications
- **Theme System**: Color palette centralized in `colors.js` for easy theme changes
- **Responsive Design**: CSS-based responsive design allows layout modifications

#### 3.6 Portability

**Operating System Compatibility**
- **Server**: Node.js runs on Windows, macOS, Linux
- **Database**: MySQL runs on Windows, macOS, Linux
- **No OS-Specific Code**: No operating system-specific code

**Database Portability**
- **MySQL Specific**: Uses MySQL-specific SQL syntax
- **No ORM**: Direct SQL queries (not database-agnostic)
- **Migration Required**: Significant changes needed to port to other databases

**Deployment Environment**
- **Development**: Currently configured for local development (localhost)
- **Production Ready**: Requires configuration changes for production deployment
- **Cloud Compatibility**: Can be deployed to cloud platforms (AWS, Azure, GCP) with configuration changes

**Browser Compatibility**
- **Modern Browsers**: Requires modern browsers with ES6+ support
- **React Compatibility**: React 18+ requires modern browser features
- **No IE Support**: No Internet Explorer support

**Mobile Compatibility**
- **Responsive Design**: UI adapts to mobile screen sizes
- **Touch Support**: Touch-friendly interface elements
- **Mobile Browser Support**: Works on mobile browsers (iOS Safari, Chrome Mobile)

#### 3.7 Others

**Scalability Considerations**
- **Horizontal Scaling**: Not currently designed for horizontal scaling (single server)
- **Database Scaling**: Single MySQL instance (no replication or sharding)
- **File Storage Scaling**: Local filesystem limits scalability (should use cloud storage)
- **Session Management**: Client-side sessions allow horizontal scaling (no server-side session store)

**Monitoring and Observability**
- **No Application Monitoring**: No APM tools (e.g., New Relic, Datadog)
- **No Error Tracking**: No error tracking service (e.g., Sentry)
- **No Analytics**: No user analytics or behavior tracking
- **Basic Logging**: Console logging only

**Internationalization (i18n)**
- **No i18n Support**: Application in English only
- **No Multi-Language**: No support for multiple languages
- **Currency**: Fixed to UGX (Uganda Shillings)

**Accessibility (a11y)**
- **Basic Accessibility**: Semantic HTML, but no comprehensive accessibility features
- **No Screen Reader Support**: Limited screen reader compatibility
- **Keyboard Navigation**: Partial keyboard navigation support
- **Color Contrast**: Color palette designed for readability

**Performance Optimization**
- **No CDN**: Media files served directly from server
- **No Image Optimization**: Images not optimized or compressed
- **No Lazy Loading**: All content loaded immediately
- **No Code Splitting**: Single React bundle (no code splitting)

**Compliance and Legal**
- **No Terms of Service**: No terms of service or privacy policy
- **No Data Retention Policy**: No defined data retention periods
- **No User Agreement**: No user agreement or consent mechanisms

---

**Document Version**: 1.0  
**Last Updated**: 2025  
**Prepared For**: HangoutSpots Platform Documentation

