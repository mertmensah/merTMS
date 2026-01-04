# 🔐 Rotating Your Google Gemini API Key - Security Guide

## ⚠️ **CRITICAL: Your Current Key May Be Exposed**

Your `.env` files are correctly in `.gitignore`, **BUT** you need to verify they were never committed to Git history.

---

## 📍 **Where the API Key is Used**

### **1. Code References (Safe ✅)**
Your code properly reads from environment variables:

```python
# backend/config/settings.py
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-gemini-api-key")
```

**Used in these files:**
- `backend/config/settings.py` - Configuration loader
- `backend/agents/base_agent.py` - AI agent base class
- `backend/agents/mertsights_ai.py` - MertSights AI assistant
- `backend/app.py` - Flask application
- `backend/test_models.py` - Testing script

**✅ Good news**: None of these files contain the actual key, they only read from environment variables.

### **2. Environment Files (LOCAL ONLY)**

**Files containing your key:**
- ❌ `backend/.env` - **LOCAL ONLY, should NEVER be in Git**
- ❌ `.env.example` - Template file (safe, no real key)
- ❌ `backend/.env.example` - Template file (safe, no real key)

### **3. Render Dashboard (PRODUCTION)**
Your production backend on Render uses environment variables set in the Render dashboard.

### **4. GitHub (MUST BE EMPTY ✅)**
Your repository should NOT contain any `.env` files with real keys (protected by `.gitignore`).

### **5. Supabase (NOT USED)**
Supabase does NOT use the Gemini API key. Only Render backend uses it.

---

## 🔒 **Step-by-Step: Rotate Your API Key Securely**

### **Step 1: Get a New Google Gemini API Key**

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select **"Create API key in new project"** (or use existing)
5. **Copy the new key** (starts with `AIza...`)
6. ⚠️ **Keep this window open** - you'll need the key in a moment

### **Step 2: Verify Git History is Clean**

Before rotating, check if your old key was ever committed:

```powershell
# Check if .env file was ever committed
cd "C:\Users\MertMM\Desktop\MerTM.S\TMS-Project"
git log --all --full-history -- "backend/.env"
git log --all --full-history -- ".env"
```

**If you see any commits:**
- ⚠️ Your old key IS in Git history (even if deleted now)
- 🔴 **Immediately delete the old key** from Google AI Studio
- 🔴 **The new key MUST be kept out of Git**

**If "fatal: ambiguous argument" or no results:**
- ✅ Good! Your key was never committed
- ✅ Still rotate as a precaution

### **Step 3: Update Render (PRODUCTION)**

**This is where your live backend gets the key:**

1. **Log into Render** at [https://dashboard.render.com](https://dashboard.render.com)

2. **Navigate to your service**:
   - Click on **"mertms-nwh7"** (or your backend service name)

3. **Go to Environment tab**:
   - Click **"Environment"** in the left sidebar

4. **Update GEMINI_API_KEY**:
   - Find the `GEMINI_API_KEY` variable
   - Click the **edit/pencil icon**
   - **Paste your NEW API key**
   - Click **"Save Changes"**

5. **Render will automatically redeploy**:
   - Takes ~2-3 minutes
   - Watch the "Logs" tab for "Deploy succeeded"
   - Backend will restart with new key

6. **Test it works**:
   ```
   Visit: https://mertms-nwh7.onrender.com/health
   Should return: {"status": "healthy", "service": "TMS Backend"}
   ```

7. **Test AI functionality**:
   - Visit your live site: https://mertmensah.github.io/merTMS/
   - Go to "Load Builder"
   - Click "Optimize Loads" (should work if AI is functioning)

### **Step 4: Update Local Development Environment**

**Update your local `.env` file:**

```powershell
# Navigate to backend directory
cd "C:\Users\MertMM\Desktop\MerTM.S\TMS-Project\backend"

# Edit .env file (use your preferred editor)
notepad .env
```

**Replace this line:**
```env
  GEMINI_API_KEY=your_old_key_here  # OLD KEY

**With your new key:**
```env
GEMINI_API_KEY=AIza...your_new_key_here  # NEW KEY
```

**Save and close the file.**

### **Step 5: Test Locally**

```powershell
# Make sure you're in backend directory
cd "C:\Users\MertMM\Desktop\MerTM.S\TMS-Project\backend"

# Start backend
python app.py

# Should see:
# [merTM.S] Backend starting on port 5000...
# [API] Available at: http://localhost:5000
```

If you see errors about "GEMINI_API_KEY not configured", the new key wasn't loaded. Double-check your `.env` file.

### **Step 6: Delete Old Key from Google**

**IMPORTANT: Only do this AFTER confirming the new key works!**

1. Go back to [Google AI Studio API Keys](https://aistudio.google.com/app/apikey)
2. Find your **OLD key** (the one you replaced)
3. Click the **trash/delete icon**
4. Confirm deletion
5. ✅ Old key is now permanently revoked

---

## 🔐 **Security Best Practices Going Forward**

### **1. Never Commit API Keys to Git**

**✅ Already protected:**
```gitignore
# Your .gitignore file
.env
.env.local
backend/.env
frontend/.env
```

### **2. Verify Before Each Commit**

```powershell
# Before committing, check for secrets
git diff

# Make sure you don't see any lines like:
# GEMINI_API_KEY=AIza...
# SUPABASE_KEY=eyJh...
```

### **3. Use Environment Variables Everywhere**

**✅ Your code already does this correctly:**
```python
# Good ✅
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Bad ❌ (NEVER do this)
  GEMINI_API_KEY = "your_key_here"

### **4. Rotate Keys Periodically**

**Recommended schedule:**
- Every 90 days for production
- Immediately if key is potentially exposed
- After team member leaves (if applicable)

### **5. Use Different Keys for Different Environments**

Consider using separate keys for:
- **Development** (local machine)
- **Production** (Render)
- **Testing** (CI/CD if you set it up)

---

## 🧪 **Testing Checklist**

After rotating the key, verify these work:

### **Production (Render):**
- [ ] Backend health check: `https://mertms-nwh7.onrender.com/health`
- [ ] Load optimization works (uses Gemini)
- [ ] MertSights AI chat works (uses Gemini)
- [ ] Route planning works (uses Gemini)
- [ ] Cost analysis works (uses Gemini)

### **Local Development:**
- [ ] Backend starts without errors: `python app.py`
- [ ] Health check works: `http://localhost:5000/health`
- [ ] AI features work locally

---

## 🚨 **If You Suspect Key Was Exposed in Git History**

### **Option 1: Clean Git History (Advanced)**

```powershell
# WARNING: This rewrites history - coordinate with any collaborators!

# Install BFG Repo Cleaner or use git-filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: Destructive!)
git push origin --force --all
```

### **Option 2: Start Fresh (Simpler)**

If the repo was only used by you:

1. Delete old key from Google immediately
2. Create new GitHub repository
3. Push clean code to new repo
4. Update Render to pull from new repo

---

## 📊 **Current Setup Summary**

| Location | Purpose | Update Required? |
|----------|---------|------------------|
| **Render Environment Variables** | Production backend | ✅ **YES - UPDATE HERE** |
| **Local `backend/.env`** | Development | ✅ **YES - UPDATE HERE** |
| **GitHub Repository** | Code storage | ✅ **Verify no keys present** |
| **Supabase Dashboard** | Database config | ❌ No (doesn't use Gemini) |
| **Frontend `.env`** | React build vars | ❌ No (only backend uses Gemini) |
| **Code files (`.py`)** | Application logic | ❌ No (already reads from env vars) |

---

## ✅ **Final Verification**

Once you've completed all steps:

1. **Old key deleted** from Google AI Studio ✅
2. **New key in Render** environment variables ✅
3. **New key in local** `backend/.env` ✅
4. **Production site works** (test AI features) ✅
5. **Local development works** (start backend) ✅
6. **No keys in Git** history (verified with `git log`) ✅

---

## 🆘 **Troubleshooting**

### **Error: "GEMINI_API_KEY not configured"**

**Cause**: Environment variable not loaded

**Fix:**
```powershell
# Check if .env file exists
ls backend/.env

# Check if key is in the file
Get-Content backend/.env | Select-String "GEMINI_API_KEY"

# Restart backend to reload env vars
```

### **Error: "Invalid API key"**

**Cause**: Key is incorrect or old key still in use

**Fix:**
1. Double-check you copied the full key (starts with `AIza`, ~39 characters)
2. Verify you saved the Render environment variables
3. Wait for Render to fully redeploy (~2 minutes)
4. Clear browser cache and retry

### **Production works but local doesn't**

**Cause**: Local `.env` not updated

**Fix:**
```powershell
# Check what key is loaded
cd backend
python -c "from config.settings import GEMINI_API_KEY; print(GEMINI_API_KEY[:10] + '...')"

# Should show first 10 chars of NEW key
# If it shows old key or "your-gemini...", update backend/.env
```

---

**Need help?** Check the key in Render dashboard matches the key in your local `.env` file.
