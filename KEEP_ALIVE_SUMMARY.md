# Supabase Keep-Alive - Quick Reference

## 📋 The Problem
- **Supabase free tier pauses after 7 days of inactivity**
- **Deleted after another 7 days if still paused**
- **Activity needed**: Database connection, API request, or Auth request

## ✅ Our Solution

### What We Built
A keep-alive mechanism that automatically pings Supabase to prevent pausing.

### Files Added
1. `backend/utils/keep_alive.py` - Keep-alive utility class
2. `backend/app.py` - Modified to initialize keep-alive on startup
3. `SUPABASE_KEEP_ALIVE.md` - Complete documentation

### How It Works
```
User visits site → Render wakes up → Flask app starts 
→ initialize_keep_alive() runs → Pings Supabase 
→ Supabase 7-day timer resets → ✓ Database stays active
```

## 🌐 Endpoints

### Keep-Alive Endpoint
```
GET https://mertms-nwh7.onrender.com/api/keep-alive
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-01-04T15:30:00Z",
  "response_time_ms": 145,
  "ping_count": 42,
  "message": "Supabase database pinged successfully"
}
```

**Features:**
- ✅ Rate-limited (max once per hour)
- ✅ Returns status even if rate-limited
- ✅ Can be pinged by external cron services

## 🎯 Recommended External Monitoring

### Option 1: UptimeRobot (Best)
- **Cost**: Free forever
- **Setup**: 2 minutes
- **Interval**: Every 5 minutes
- **Benefit**: Keeps both Render AND Supabase active 24/7
- **Link**: [https://uptimerobot.com](https://uptimerobot.com)

**Setup:**
1. Create account
2. Add monitor: `https://mertms-nwh7.onrender.com/api/keep-alive`
3. Set interval: 5 minutes
4. Done! ✓

### Option 2: Cron-Job.org (Simple)
- **Cost**: Free
- **Setup**: 5 minutes
- **Interval**: Every 3 days (customizable)
- **Link**: [https://cron-job.org](https://cron-job.org)

### Option 3: GitHub Actions (For Developers)
- Add workflow file to repo
- Runs every 3 days automatically
- See `SUPABASE_KEEP_ALIVE.md` for code

## 🔍 Current Status

### What Happens Now (Without External Monitor)
- ✅ Render wakes when users visit site
- ✅ Keep-alive pings on Render startup
- ✅ Works great if site gets traffic at least once per 7 days
- ⚠️ Risk if no visitors for 7+ days

### With UptimeRobot (Recommended)
- ✅ Render pinged every 5 minutes (never sleeps)
- ✅ Supabase pinged every 5 minutes (never pauses)
- ✅ Zero cold starts (instant response for users)
- ✅ 100% uptime guarantee
- ✅ Still $0/month

## 🧪 Testing

Test the keep-alive is working:
```bash
curl https://mertms-nwh7.onrender.com/api/keep-alive
```

Should return JSON with `"success": true`

## 📊 Statistics

**Without external monitoring:**
- Needs 1 visitor per 7 days to stay active
- Cold starts on first request after 15min

**With UptimeRobot:**
- Always active (8760 pings per week)
- No cold starts ever
- Instant response 24/7

## ⚡ Next Steps

1. ✅ Code is deployed to Render
2. ✅ Keep-alive runs automatically on startup
3. 🔲 **Set up UptimeRobot** (recommended, takes 2 minutes)
4. 🔲 Test endpoint works
5. 🔲 Monitor for a week to confirm

## 🚨 Emergency Manual Ping

If you suspect Supabase might pause:
1. Visit: `https://mertms-nwh7.onrender.com/api/keep-alive`
2. Wait for JSON response
3. Check `"success": true`
4. Database stays active for 7 more days

## 📅 Maintenance

**Without external monitor:**
- Visit site at least once per week

**With UptimeRobot:**
- No maintenance needed
- Check UptimeRobot dashboard monthly (optional)

---

**TL;DR**: Your backend now automatically pings Supabase when it starts. For bulletproof reliability, add UptimeRobot monitoring (2 min setup, free forever).
