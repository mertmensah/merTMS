# 🚀 Deployment Guide

## Prerequisites
- GitHub account
- Render account (free tier available at https://render.com)
- Supabase project with database setup
- Google Gemini API key

---

## Part 1: Deploy to GitHub

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `tms-control-tower` (or your preferred name)
3. Description: "Transportation Management System with AI-powered Control Tower"
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have them)
6. Click **Create repository**

### Step 2: Push Code to GitHub
Run these commands in your terminal:

```bash
cd C:\Users\MertMM\Desktop\MerTM.S\TMS-Project
git remote add origin https://github.com/YOUR_USERNAME/tms-control-tower.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Part 2: Deploy Backend to Render

### Step 1: Sign Up for Render
1. Go to https://render.com
2. Sign up using your GitHub account (recommended)
3. Authorize Render to access your GitHub repositories

### Step 2: Create New Web Service
1. From Render Dashboard, click **New +** → **Web Service**
2. Connect your GitHub repository: `tms-control-tower`
3. Configure the service:
   - **Name**: `tms-backend` (or your preferred name)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT app:app`
   - **Instance Type**: `Free`

### Step 3: Add Environment Variables
In the Render service settings, add these environment variables:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase anon/public key |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `FLASK_ENV` | `production` |
| `FLASK_DEBUG` | `0` |

### Step 4: Deploy
1. Click **Create Web Service**
2. Wait for deployment to complete (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://tms-backend-xxxx.onrender.com`
4. **Save this URL!** You'll need it for the frontend

### Step 5: Test Backend
Visit `https://tms-backend-xxxx.onrender.com/api/orders` in your browser.
You should see a JSON response with orders data.

---

## Part 3: Deploy Frontend

### Option A: Vercel (Recommended - Easiest)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **Add New** → **Project**
4. Import your `tms-control-tower` repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment Variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://tms-backend-xxxx.onrender.com/api` (your Render backend URL)
7. Click **Deploy**

### Option B: Render (Static Site)

1. From Render Dashboard, click **New +** → **Static Site**
2. Connect your repository
3. Configure:
   - **Name**: `tms-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://tms-backend-xxxx.onrender.com/api`
5. Click **Create Static Site**

### Option C: Netlify

1. Go to https://netlify.com
2. Sign up with GitHub
3. Click **Add new site** → **Import an existing project**
4. Choose GitHub and select your repository
5. Configure:
   - **Branch**: `main`
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
6. Click **Show advanced** → **New variable**:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://tms-backend-xxxx.onrender.com/api`
7. Click **Deploy site**

---

## Part 4: Update CORS Settings

After deploying frontend, update your backend's CORS settings:

1. In `backend/app.py`, find the CORS configuration (around line 20-30)
2. Add your frontend URL to allowed origins:

```python
from flask_cors import CORS

CORS(app, origins=[
    "http://localhost:5173",
    "https://your-frontend-url.vercel.app",  # Add your actual frontend URL
    "https://your-frontend-url.onrender.com",
    "https://your-frontend-url.netlify.app"
])
```

3. Commit and push changes:
```bash
git add backend/app.py
git commit -m "Update CORS for production frontend"
git push
```

Render will automatically redeploy your backend.

---

## Part 5: Verify Deployment

### Backend Health Check
Visit: `https://tms-backend-xxxx.onrender.com/api/orders`

Expected: JSON response with orders

### Frontend Access
Visit your frontend URL and test:
1. **Dashboard** - Should show metrics
2. **Orders** - Can generate and view orders
3. **Control Tower** - Simulate loads button works
4. **AI Assistant** - Can ask questions

---

## Important Notes

### Render Free Tier Limitations
- Backend sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- 750 hours/month free (more than enough)

### Database
- Keep using your Supabase database (it's already cloud-hosted)
- No changes needed

### Monitoring
- Render Dashboard shows logs and metrics
- Check logs if something breaks

---

## Troubleshooting

### Backend not responding
- Check Render logs for errors
- Verify environment variables are set correctly
- Ensure Supabase database is accessible

### Frontend can't reach backend
- Check CORS configuration in `app.py`
- Verify `VITE_API_URL` environment variable
- Check browser console for errors

### AI features not working
- Verify `GEMINI_API_KEY` is set correctly
- Check API quota/billing in Google Cloud Console

---

## Updating Your App

After making code changes:

```bash
git add .
git commit -m "Description of changes"
git push
```

- **Backend**: Render auto-deploys on push to `main` branch
- **Frontend**: Vercel/Netlify auto-deploys on push to `main` branch

---

## Cost Estimate

- **Supabase**: Free tier (500MB database)
- **Render Backend**: Free tier (750 hours/month)
- **Vercel/Netlify Frontend**: Free tier (unlimited bandwidth)
- **Google Gemini API**: Free tier (60 requests/minute)

**Total: $0/month** for moderate usage!

---

## Next Steps

1. Share your live URL with users
2. Monitor usage in Render/Vercel dashboards
3. Consider upgrading if you exceed free tier limits
4. Add custom domain (optional, ~$10-15/year)

Enjoy your deployed TMS Control Tower! 🚛📊
