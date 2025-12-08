# Backend Deployment Guide - Render

This guide will help you deploy your Spotlight Uganda backend to Render (free tier available).

## Why Render?

✅ **Free tier available** (with some limitations)  
✅ **Easy setup** - Deploy from GitHub in minutes  
✅ **Automatic SSL** - HTTPS included  
✅ **Environment variables** - Easy configuration  
✅ **Auto-deploy** - Deploys on every push  
✅ **Great for Node.js** - Perfect for Express apps  

**Alternative:** Railway (also free, similar setup)

---

## Prerequisites

1. ✅ GitHub account (free)
2. ✅ Render account (free) - [render.com](https://render.com)
3. ✅ MongoDB Atlas connection string (already set up ✅)
4. ✅ Backend code ready (✅ Done)

---

## Step 1: Prepare Your Backend Code

### 1.1 Ensure package.json has correct start script

Your `package.json` already has:
```json
"scripts": {
  "start": "node app.js"
}
```
✅ This is correct!

### 1.2 Create .gitignore (if not exists)

Make sure `.gitignore` includes:
```
node_modules/
.env
uploads/
*.log
.DS_Store
```

### 1.3 Commit and Push to GitHub

If you haven't already, push your backend code to GitHub:

```bash
cd /Users/nal/Documents/hangoutspots_backend

# Initialize git if needed
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for deployment"

# Create a GitHub repo and push
# (Go to github.com, create new repo, then:)
git remote add origin https://github.com/yourusername/hangoutspots-backend.git
git branch -M main
git push -u origin main
```

---

## Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (easiest way)
3. Verify your email

---

## Step 3: Create New Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - Select your backend repository
   - Click **"Connect"**
3. Configure your service:

   **Name:** `spotlight-uganda-backend` (or any name)
   
   **Region:** Choose closest to your users (e.g., `Oregon (US West)`)
   
   **Branch:** `main` (or your default branch)
   
   **Root Directory:** Leave empty (or `backend` if your repo has frontend too)
   
   **Runtime:** `Node`
   
   **Build Command:** `npm install`
   
   **Start Command:** `npm start`
   
   **Plan:** `Free` (or paid if you want more resources)

4. Click **"Create Web Service"**

---

## Step 4: Configure Environment Variables

In your Render service dashboard, go to **"Environment"** tab and add:

### Required Variables:

```env
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/spotlight_uganda?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
PORT=10000
NODE_ENV=production
FRONTEND_URL=http://localhost:5173,https://your-firebase-project.web.app
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

**Important Notes:**
- `PORT` - Render sets this automatically, but you can use `10000` as default
- `MONGO_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Generate a strong random string (see below)
- `FRONTEND_URL` - Add your Firebase URL after deploying frontend

### Generate JWT Secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use an online generator: [randomkeygen.com](https://randomkeygen.com/)

---

## Step 5: Update app.js for Render

Your `app.js` already uses `process.env.PORT || 3000`, which is perfect! ✅

Render will automatically set the `PORT` environment variable, so your app will work.

---

## Step 6: Handle File Uploads

**Important:** Render's free tier has **ephemeral filesystem** - files in `uploads/` will be deleted on restart.

### Option A: Use MongoDB GridFS (Recommended)
Store files in MongoDB instead of filesystem.

### Option B: Use Cloud Storage
- AWS S3
- Cloudinary
- Firebase Storage

### Option C: Keep Current Setup (For Now)
For initial deployment, you can keep the current setup, but know that:
- Files will be lost on restart
- This is fine for testing, but not production

**For now, we'll deploy as-is and you can migrate file storage later.**

---

## Step 7: Deploy

1. After setting environment variables, Render will automatically:
   - Install dependencies (`npm install`)
   - Start your app (`npm start`)

2. Watch the logs in Render dashboard to see:
   - ✅ Build progress
   - ✅ "MongoDB connected successfully"
   - ✅ "Server running on http://localhost:XXXX"

3. Your backend will be live at:
   ```
   https://spotlight-uganda-backend.onrender.com
   ```
   (or your custom name)

---

## Step 8: Test Your Deployment

1. Visit your Render URL in browser
2. Test an endpoint:
   ```
   https://your-backend.onrender.com/reviews
   ```
3. Check logs for any errors

---

## Step 9: Update Frontend API URL

After backend is deployed, update your frontend `.env.production`:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

Then rebuild and deploy frontend.

---

## Step 10: Update Backend CORS

Update `FRONTEND_URL` in Render environment variables to include your Firebase URL:

```env
FRONTEND_URL=http://localhost:5173,https://your-firebase-project.web.app
```

Render will automatically restart your service.

---

## Troubleshooting

### Issue: "Build failed"
**Solution:**
- Check build logs in Render dashboard
- Ensure `package.json` has correct `start` script
- Check Node.js version compatibility

### Issue: "MongoDB connection failed"
**Solution:**
- Verify `MONGO_URI` is correct in environment variables
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Render)
- Verify password special characters are URL-encoded

### Issue: "Application error"
**Solution:**
- Check logs in Render dashboard
- Verify all environment variables are set
- Check that `PORT` is being used correctly

### Issue: "CORS errors"
**Solution:**
- Verify `FRONTEND_URL` includes your frontend URL
- Check that CORS middleware is configured correctly
- Ensure frontend is using correct API URL

### Issue: "Files not persisting"
**Solution:**
- This is expected on Render free tier
- Migrate to MongoDB GridFS or cloud storage (see Step 6)

---

## Render Free Tier Limitations

⚠️ **Important:**
- **Spins down after 15 minutes of inactivity** - First request after spin-down takes ~30 seconds
- **512MB RAM** - Should be enough for your app
- **0.1 CPU** - Fine for low-medium traffic
- **Ephemeral filesystem** - Files deleted on restart

**Upgrade to paid ($7/month)** for:
- Always-on service (no spin-down)
- More resources
- Persistent storage

---

## Alternative: Railway

Railway is another great option with similar setup:

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub"
4. Select your backend repo
5. Add environment variables
6. Deploy!

Railway free tier:
- $5 free credit/month
- No spin-down
- Easy setup

---

## Quick Reference

### Render Dashboard URLs
- **Service:** `https://dashboard.render.com/web/your-service-name`
- **Logs:** Available in dashboard
- **Environment:** Settings → Environment

### Environment Variables Checklist
- [ ] `MONGO_URI`
- [ ] `JWT_SECRET`
- [ ] `PORT` (optional, Render sets automatically)
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL`
- [ ] `GOOGLE_PLACES_API_KEY`

### Commands
```bash
# Local testing
npm start

# Check logs (in Render dashboard)
# View → Logs

# Restart service
# Settings → Manual Deploy → Clear build cache & deploy
```

---

## Next Steps After Backend Deployment

1. ✅ Test all API endpoints
2. ✅ Update frontend `.env.production` with backend URL
3. ✅ Deploy frontend to Firebase
4. ✅ Update backend `FRONTEND_URL` with Firebase URL
5. ✅ Test full application

---

## Support

If you encounter issues:
1. Check Render logs
2. Verify environment variables
3. Test MongoDB connection locally
4. Check CORS configuration

Good luck! 🚀

