# Supabase Free Tier Keep-Alive Setup

## 📊 Supabase Free Tier Requirements

### Inactivity Policy
- **Pause after**: 7 days of no activity
- **Deletion after**: 7 additional days (14 days total from last activity)
- **Activity types that count**:
  - Database connections (queries, inserts, updates)
  - API requests to Supabase endpoints
  - Auth requests (login, signup, token refresh)

### What Happens When Paused?
1. Database becomes inaccessible
2. All API requests fail
3. You receive email notification
4. Must manually un-pause in Supabase dashboard
5. If not un-paused within 7 days → **permanent deletion**

---

## ✅ Our Automated Solution

### Strategy Overview
We use a **multi-layer approach** to ensure database stays active:

1. **Automatic on Render Startup** (Primary)
   - Every time Render backend wakes up, we ping Supabase
   - Render wakes on any HTTP request to the backend
   - Normal user traffic keeps both systems alive

2. **Dedicated Keep-Alive Endpoint** (Backup)
   - External monitoring services ping `/api/keep-alive`
   - Ensures activity even if frontend has no users for days
   - Rate-limited to prevent excessive pinging

3. **Manual Trigger** (Emergency)
   - Visit `https://mertms-nwh7.onrender.com/api/keep-alive` in browser
   - Can be added to bookmarks or calendar reminder

---

## 🔧 Implementation Details

### Backend Keep-Alive Mechanism

**File**: `backend/utils/keep_alive.py`

**What it does**:
```python
# Executes minimal query to register database activity
SELECT id FROM facilities LIMIT 1;

# This is enough to:
# ✓ Register as "database connection"
# ✓ Reset 7-day inactivity timer
# ✓ Prevent pause/deletion
```

**Features**:
- Lightweight query (no heavy computation)
- Error handling and retry logic
- Activity logging and statistics
- Rate limiting (max once per hour)

**Runs automatically**:
- On Flask app startup (when Render wakes)
- When `/api/keep-alive` endpoint is called

---

## 🌐 Setting Up External Monitoring (Recommended)

To add an extra layer of protection, use a free monitoring service to ping your backend every 3-7 days.

### Option 1: UptimeRobot (Free Forever Plan)

**Why UptimeRobot?**
- ✅ 50 monitors free forever
- ✅ 5-minute check intervals
- ✅ Email/SMS alerts if down
- ✅ No credit card required

**Setup Steps**:

1. **Sign up** at [https://uptimerobot.com](https://uptimerobot.com)

2. **Create New Monitor**:
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `merTMS Keep-Alive`
   - URL: `https://mertms-nwh7.onrender.com/api/keep-alive`
   - Monitoring Interval: `Every 5 minutes` (free tier)

3. **Configure Alerts** (optional):
   - Add your email for downtime notifications
   - Get notified if backend goes down

4. **Result**:
   - Backend pinged every 5 minutes
   - Render stays awake (no cold starts for users)
   - Supabase gets activity every 5 minutes
   - Both systems stay perpetually active

### Option 2: Cron-Job.org (Simpler, Less Frequent)

**Why Cron-Job.org?**
- ✅ Simple setup
- ✅ No signup required for basic use
- ✅ Set custom intervals (every 3 days is enough)

**Setup Steps**:

1. **Visit** [https://cron-job.org/en/](https://cron-job.org/en/)

2. **Create Account** (free)

3. **Create Cronjob**:
   - Title: `merTMS Supabase Keep-Alive`
   - URL: `https://mertms-nwh7.onrender.com/api/keep-alive`
   - Schedule: `Every 3 days` (or weekly)
   - Timeout: `30 seconds`

4. **Result**:
   - Automatic ping every 3 days
   - Supabase stays active (needs ping every 7 days)
   - 4-day safety margin

### Option 3: GitHub Actions (For Developers)

**Why GitHub Actions?**
- ✅ Already using GitHub
- ✅ Fully customizable schedule
- ✅ Free for public repos

**Setup Steps**:

1. **Create** `.github/workflows/keep-alive.yml` in your repo:

```yaml
name: Keep Services Alive

on:
  schedule:
    # Run every 3 days at 9:00 AM UTC
    - cron: '0 9 */3 * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Render Backend
        run: |
          echo "Pinging backend to keep Render awake..."
          curl -f https://mertms-nwh7.onrender.com/health || exit 1
          
      - name: Ping Supabase Keep-Alive
        run: |
          echo "Pinging keep-alive endpoint..."
          response=$(curl -f https://mertms-nwh7.onrender.com/api/keep-alive)
          echo "Response: $response"
          
      - name: Report Success
        run: echo "✓ Keep-alive ping successful"
```

2. **Commit and push** to GitHub

3. **Result**:
   - Automated pings every 3 days
   - Visible in GitHub Actions tab
   - Can manually trigger anytime

---

## 📊 Monitoring Keep-Alive Status

### Check Current Status

**Option 1: Visit Endpoint**
```
GET https://mertms-nwh7.onrender.com/api/keep-alive
```

**Response Example**:
```json
{
  "success": true,
  "timestamp": "2026-01-04T15:30:00Z",
  "response_time_ms": 145,
  "ping_count": 42,
  "message": "Supabase database pinged successfully",
  "rows_returned": 1
}
```

**Option 2: Check Backend Logs**

When backend starts, you'll see:
```
[KEEP-ALIVE] Initializing Supabase keep-alive...
[KEEP-ALIVE] ✓ Initial ping successful
[KEEP-ALIVE] Database will remain active for 7 days from now
```

---

## 🎯 Recommended Setup

For **maximum reliability**, use this combination:

1. ✅ **Automatic on Render startup** (built-in, already working)
2. ✅ **UptimeRobot every 5 minutes** (keeps Render + Supabase always active)
3. ✅ **GitHub Actions every 3 days** (backup monitoring)

**Why this works**:
- Render never spins down (pinged every 5 min)
- Supabase never goes inactive (pinged every 5 min)
- No cold starts for users (always instant response)
- Triple redundancy (startup + UptimeRobot + GitHub Actions)
- Zero cost (all services free tier)

---

## 💰 Cost Analysis

| Service | Free Tier | Cost to Keep Active |
|---------|-----------|---------------------|
| **Render** | 750 hours/month | $0 (covered by requests) |
| **Supabase** | Unlimited, but auto-pauses | $0 (1 query per 7 days) |
| **UptimeRobot** | 50 monitors | $0 |
| **GitHub Actions** | 2,000 minutes/month | $0 (uses ~1 min/month) |
| **Total** | - | **$0/month** |

---

## 🚨 What If Systems Still Get Paused?

### If Supabase Gets Paused:

1. **Check email** for Supabase notification
2. **Log into** [https://supabase.com/dashboard](https://supabase.com/dashboard)
3. **Navigate to** your project
4. **Click** "Un-pause project" button
5. **Wait** 1-2 minutes for database to resume
6. **Test** by visiting `https://mertms-nwh7.onrender.com/api/keep-alive`

### If Render Goes Down:

1. **Visit** [https://dashboard.render.com](https://dashboard.render.com)
2. **Check** service logs for errors
3. **Manually restart** service if needed
4. **Check** UptimeRobot dashboard for downtime history

---

## 🔍 Testing the Keep-Alive System

### Test 1: Manual Ping
```bash
# Ping the keep-alive endpoint
curl https://mertms-nwh7.onrender.com/api/keep-alive

# Expected output (JSON):
{
  "success": true,
  "timestamp": "...",
  "response_time_ms": ...,
  "ping_count": ...,
  "message": "Supabase database pinged successfully"
}
```

### Test 2: Check Startup Logs
```bash
# Start backend locally
cd backend
python app.py

# Look for these lines:
[KEEP-ALIVE] Initializing Supabase keep-alive...
[KEEP-ALIVE] Supabase ping #1 successful (123ms)
[KEEP-ALIVE] ✓ Initial ping successful
```

### Test 3: Verify Rate Limiting
```bash
# Ping twice quickly
curl https://mertms-nwh7.onrender.com/api/keep-alive
# Wait < 1 hour
curl https://mertms-nwh7.onrender.com/api/keep-alive

# Second response should say:
{
  "success": true,
  "message": "Ping skipped - too soon since last ping",
  ...
}
```

---

## 📅 Maintenance Schedule

| Task | Frequency | Action |
|------|-----------|--------|
| Check UptimeRobot status | Weekly | Verify monitors are green |
| Review backend logs | Monthly | Check for keep-alive errors |
| Test manual ping | Monthly | Verify `/api/keep-alive` works |
| Update monitoring URLs | When deploying | Update UptimeRobot/GitHub Actions |
| Check Supabase dashboard | Monthly | Confirm project is active |

---

## 📚 Additional Resources

- [Supabase Inactivity Policy](https://supabase.com/docs/guides/platform/going-into-prod#free-tier-pausing)
- [Render Free Tier Details](https://render.com/docs/free)
- [UptimeRobot Documentation](https://uptimerobot.com/api/)
- [Cron-Job.org FAQ](https://cron-job.org/en/documentation/)

---

## ✅ Quick Start Checklist

- [ ] Backend includes `utils/keep_alive.py`
- [ ] App.py imports and calls `initialize_keep_alive()`
- [ ] `/api/keep-alive` endpoint is accessible
- [ ] UptimeRobot monitor created (5-min interval)
- [ ] GitHub Actions workflow added (optional)
- [ ] Test manual ping returns success
- [ ] Check backend startup logs show successful ping
- [ ] Bookmark monitoring dashboards

**Result**: Your Supabase database will stay active indefinitely at zero cost! 🎉
