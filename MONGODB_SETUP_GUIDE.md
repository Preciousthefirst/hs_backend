# MongoDB Atlas Setup Guide

## Step 1: Get Your MongoDB Atlas Connection String

### 1.1 Log in to MongoDB Atlas
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Log in to your account

### 1.2 Create or Select a Cluster
- If you don't have a cluster, create a free M0 cluster (it's free forever)
- Choose a cloud provider and region closest to you
- Wait for the cluster to be created (takes a few minutes)

### 1.3 Create a Database User
1. Click **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username (e.g., `spotlight_admin`)
5. Enter a strong password (save this - you'll need it!)
6. Under **"Database User Privileges"**, select **"Atlas admin"** or **"Read and write to any database"**
7. Click **"Add User"**

### 1.4 Whitelist Your IP Address
1. Click **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. For development, click **"Add Current IP Address"** (or **"Allow Access from Anywhere"** with `0.0.0.0/0` - less secure but easier for testing)
4. Click **"Confirm"**

### 1.5 Get Your Connection String
1. Click **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver
5. Copy the connection string - it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 1.6 Customize the Connection String
Replace the placeholders in the connection string:
- Replace `<username>` with your database username
- Replace `<password>` with your database password (URL-encode special characters if needed)
- Add your database name before the `?` (e.g., `spotlight_uganda`)

**Final format:**
```
mongodb+srv://spotlight_admin:your_password@cluster0.xxxxx.mongodb.net/spotlight_uganda?retryWrites=true&w=majority
```

## Step 2: Create Your .env File

1. In your backend root directory (`/Users/nal/Documents/hangoutspots_backend/`), create a file named `.env`
2. Copy the contents from `.env.example` and fill in your values:

```env
# MongoDB Atlas Connection String
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/spotlight_uganda?retryWrites=true&w=majority

# JWT Secret Key (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Server Port
PORT=3000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Google Places API Key
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

## Step 3: Important Notes

### Password Special Characters
If your password contains special characters, you need to URL-encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- `&` becomes `%26`
- `+` becomes `%2B`
- `/` becomes `%2F`
- `=` becomes `%3D`
- `?` becomes `%3F`

**Example:**
- Password: `MyP@ss#123`
- Encoded: `MyP%40ss%23123`
- Connection string: `mongodb+srv://user:MyP%40ss%23123@cluster0.xxxxx.mongodb.net/...`

### Generate a Strong JWT Secret
You can generate a random JWT secret using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use an online generator like [randomkeygen.com](https://randomkeygen.com/)

## Step 4: Test Your Connection

1. Make sure your `.env` file is in the backend root directory
2. Start your server:
   ```bash
   npm start
   ```
   or
   ```bash
   node app.js
   ```

3. You should see:
   ```
   MongoDB connected successfully
   Server running on http://localhost:3000
   ```

If you see an error, check:
- ✅ Username and password are correct
- ✅ Password special characters are URL-encoded
- ✅ IP address is whitelisted in MongoDB Atlas
- ✅ Database name is correct
- ✅ Connection string format is correct

## Step 5: Create Your Database

MongoDB Atlas will automatically create the database when you first write data to it. However, you can also create it manually:

1. In MongoDB Atlas, click **"Browse Collections"**
2. If no database exists, click **"Create Database"**
3. Enter database name: `spotlight_uganda`
4. Collection name: `users` (or any name - collections are created automatically)

## Troubleshooting

### Error: "Authentication failed"
- Check your username and password
- Make sure password special characters are URL-encoded
- Verify the user has proper permissions

### Error: "IP not whitelisted"
- Go to Network Access in MongoDB Atlas
- Add your current IP address or use `0.0.0.0/0` for development

### Error: "Connection timeout"
- Check your internet connection
- Verify the cluster is running (not paused)
- Check firewall settings

### Error: "Database name contains invalid characters"
- Database names can only contain: letters, numbers, `-`, `_`
- No spaces or special characters

## Security Best Practices

1. **Never commit `.env` to Git** - it's already in `.gitignore`
2. **Use strong passwords** - at least 16 characters with mixed case, numbers, and symbols
3. **Limit IP access** - Only whitelist IPs you need (avoid `0.0.0.0/0` in production)
4. **Use environment-specific secrets** - Different JWT secrets for dev/staging/production
5. **Rotate credentials regularly** - Change passwords periodically

## Production Setup

For production, set environment variables in your hosting platform:
- **Render**: Add in Dashboard → Environment
- **Railway**: Add in Variables tab
- **Heroku**: Use `heroku config:set MONGO_URI=...`
- **Firebase Functions**: Add in Firebase Console → Functions → Configuration

Never hardcode credentials in your code!

