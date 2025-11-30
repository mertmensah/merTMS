# 🚀 Quick Deployment Guide for merTMS

## ✅ GitHub - DONE
Your code is now at: https://github.com/mertmensah/merTMS

---

## 📄 Part 1: Enable GitHub Pages (Frontend)

### Step 1: Configure GitHub Pages
1. Go to: https://github.com/mertmensah/merTMS/settings/pages
2. Under **Source**, select: `GitHub Actions`
3. Click **Save**

### Step 2: Add Backend URL Secret
1. Go to: https://github.com/mertmensah/merTMS/settings/secrets/actions
2. Click **New repository secret**
3. Name: `VITE_API_URL`
4. Value: `https://your-render-app.onrender.com/api` (we'll get this from Render - come back to this)
5. Click **Add secret**

### Step 3: Trigger Deployment
1. Go to: https://github.com/mertmensah/merTMS/actions
2. Click on "Deploy to GitHub Pages" workflow
3. Click **Run workflow** → **Run workflow**
4. Wait 2-3 minutes for build to complete
5. Your frontend will be live at: **https://mertmensah.github.io/merTMS/**

---

## ☁️ Part 2: Deploy Backend to Render

### Step 1: Sign Up for Render
1. Go to: https://render.com
2. Click **Get Started**
3. Sign up with **GitHub** (recommended)
4. Authorize Render to access your repositories

### Step 2: Create Web Service
1. From Render Dashboard, click **New +** button (top right)
2. Select **Web Service**
3. Click **Connect** next to `mertmensah/merTMS`

### Step 3: Configure Service
Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `mer-tms-backend` (or any name you like) |
| **Region** | Choose closest to you (e.g., Oregon USA) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn --bind 0.0.0.0:$PORT app:app` |
| **Instance Type** | `Free` |

### Step 4: Add Environment Variables
Scroll down to **Environment Variables** section and add these:

| Key | Value | Where to find it |
|-----|-------|------------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_KEY` | Your Supabase anon key | Supabase Dashboard → Settings → API → anon/public |
| `GEMINI_API_KEY` | Your Google AI API key | Google AI Studio → Get API Key |
| `FLASK_ENV` | `production` | Type this exactly |
| `FLASK_DEBUG` | `0` | Type zero |

Click **Add** after each one.

### Step 5: Deploy!
1. Scroll to bottom and click **Create Web Service**
2. Wait 5-10 minutes for first deployment
3. Watch the logs - you'll see:
   - Installing dependencies
   - Starting Gunicorn
   - "Application startup complete"
4. Once deployed, copy the URL (looks like: `https://mer-tms-backend-xxxx.onrender.com`)

### Step 6: Update GitHub Secret
1. Go back to: https://github.com/mertmensah/merTMS/settings/secrets/actions
2. Click on `VITE_API_URL` secret
3. Click **Update**
4. Change value to: `https://mer-tms-backend-xxxx.onrender.com/api` (your actual Render URL + `/api`)
5. Click **Update secret**

### Step 7: Redeploy Frontend
1. Go to: https://github.com/mertmensah/merTMS/actions
2. Click on latest "Deploy to GitHub Pages" workflow
3. Click **Re-run all jobs**
4. Wait 2-3 minutes

---

## 🎉 You're Live!

**Backend**: https://mer-tms-backend-xxxx.onrender.com/api/orders
**Frontend**: https://mertmensah.github.io/merTMS/

---

## 🔧 Update CORS in Backend

After you have your GitHub Pages URL, update the backend CORS settings:

1. Edit `backend/app.py` in your local project
2. Find the CORS line (around line 20-25)
3. Change it to:

```python
from flask_cors import CORS

CORS(app, origins=[
    "http://localhost:5173",
    "https://mertmensah.github.io"
])
```

4. Commit and push:
```bash
git add backend/app.py
git commit -m "Update CORS for GitHub Pages"
git push
```

Render will auto-deploy the update in ~2 minutes.

---

## ⚠️ Important Notes

### Render Free Tier
- Backend **sleeps after 15 minutes** of inactivity
- First request after sleep takes **30-60 seconds** to wake up
- This is normal - just wait for it to wake up

### Testing
1. Visit: https://mertmensah.github.io/merTMS/
2. It might take 30-60 seconds on first load (waking up Render)
3. Click **Orders** → **Generate Orders**
4. Click **Control Tower** → **Simulate Loads**
5. Everything should work!

### Monitoring
- **Render Logs**: https://dashboard.render.com → Your Service → Logs
- **GitHub Actions**: https://github.com/mertmensah/merTMS/actions

---

## 🆘 Troubleshooting

### Frontend shows "Network Error"
- Check if backend URL secret is correct
- Visit backend URL directly: `https://your-render-url.onrender.com/api/orders`
- Wait 60 seconds if it's sleeping

### Backend won't start
- Check Render logs for errors
- Verify environment variables are set correctly
- Make sure Supabase database is accessible

### CORS errors in browser console
- Update CORS settings in `backend/app.py`
- Push changes to trigger Render redeploy

---

Need help? Check the logs first:
- **Backend**: Render Dashboard → Logs
- **Frontend**: Browser Console (F12)
