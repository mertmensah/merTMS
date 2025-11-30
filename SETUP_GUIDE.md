# TMS Setup & Deployment Guide

## 📋 Prerequisites

Before starting, ensure you have:

- **Python 3.11+** (https://www.python.org/)
- **Node.js 18+** (https://nodejs.org/)
- **Git** (https://git-scm.com/)
- **Supabase Account** (https://supabase.com/ - free tier)
- **Google Gemini API Key** (https://makersuite.google.com/app/apikey)

## 🚀 Quick Start (Local Development)

### Option 1: One-Click Start (Windows)

1. Double-click `START_TMS.bat`
2. Wait for both servers to start
3. Browser will open automatically at `http://localhost:5173`

### Option 2: Manual Start

**Backend:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

**Frontend:**
```powershell
cd frontend
npm install
npm run dev
```

## ⚙️ Configuration

### 1. Supabase Database Setup

1. Create a free account at https://supabase.com/
2. Create a new project
3. Go to **SQL Editor** in Supabase dashboard
4. Copy and paste contents of `backend/database/schema.sql`
5. Click **Run** to create all tables
6. Your Supabase credentials (already configured in .env):
   - `SUPABASE_URL`: https://jfmdxoiepcjxaitmhwkj.supabase.co
   - `SUPABASE_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon public key)

### 2. Environment Variables

Create `backend/.env` file:

```env
# Google Gemini AI
GEMINI_API_KEY=AIzaSyCCFzfQeVSsGf6C7Zw8FXZ2vPAOI7hKKPE

# Supabase Database
SUPABASE_URL=https://jfmdxoiepcjxaitmhwkj.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbWR4b2llcGNqeGFpdG1od2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjA0NTEsImV4cCI6MjA3OTk5NjQ1MX0.od6iMVpiSRi8ytZPR_PJVwMycLz9kV4cIK6Q0YX9Q24

# Flask Settings
DEBUG=True
PORT=5000
```

**⚠️ Security Note:** Never commit `.env` file to Git!

### 3. Verify Installation

Test backend:
```powershell
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "TMS Backend"
}
```

## 🧪 Testing with Synthetic Data

### Generate Test Orders

```python
from utils.erp_data_generator import ERPDataGenerator

generator = ERPDataGenerator()

# Generate 20 random orders
orders = generator.generate_orders(20)

# Generate orders for specific lane
lane_orders = generator.generate_lane_specific_orders(
    origin="Chicago, IL",
    destination="Detroit, MI",
    count=5
)

# Generate regional clustered orders
midwest_orders = generator.generate_clustered_orders(
    region="Midwest",
    count=15
)
```

### Test Load Optimization

```python
from agents.load_optimizer import LoadOptimizerAgent

optimizer = LoadOptimizerAgent()
load_plan = optimizer.optimize_loads(orders)

print(f"Optimized {len(orders)} orders into {len(load_plan['loads'])} loads")
print(f"Average utilization: {load_plan['summary']['avg_utilization']}%")
```

## 🌐 Production Deployment

### Backend on Render.com

1. **Prepare Repository:**
   - Ensure `backend/runtime.txt` specifies Python 3.11.9
   - Ensure `backend/requirements.txt` is complete
   - Commit all changes to Git

2. **Create Render Service:**
   - Go to https://render.com/
   - Click **New +** → **Web Service**
   - Connect your GitHub repository
   - Configure:
     - **Root Directory**: `backend`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `gunicorn app:app`
     - **Instance Type**: Free

3. **Add Environment Variables:**
   - `GEMINI_API_KEY`: Your Gemini API key
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_KEY`: Your Supabase key
   - `PORT`: 5000

4. **Deploy:**
   - Click **Create Web Service**
   - Wait for build to complete (~5 minutes)
   - Note your backend URL: `https://your-app.onrender.com`

### Frontend on GitHub Pages

1. **Update API Configuration:**
   ```javascript
   // frontend/src/config.js
   const API_URL = 'https://your-app.onrender.com/api';
   export default { API_URL };
   ```

2. **Deploy:**
   ```powershell
   cd frontend
   npm install
   npm run build
   npm run deploy
   ```

3. **Access:**
   - Your TMS will be live at: `https://your-username.github.io/TMS-Project/`

## 📊 Database Schema

### Tables Overview

**orders** - Customer orders from ERP
- id, order_number, customer
- origin, destination
- weight_lbs, volume_cuft
- priority, status
- delivery_window_start/end

**loads** - Optimized truck loads
- id, load_number, truck_type
- total_weight, total_volume
- utilization_percent

**routes** - Delivery routes
- id, load_id
- total_miles, total_drive_hours
- fuel_cost_estimate, efficiency_score

**carriers** - Carrier information
- id, name, mc_number
- rate_per_mile, truck_types
- rating

## 🔧 Troubleshooting

### Backend Issues

**Import Errors:**
```powershell
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

**Database Connection Errors:**
- Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Check Supabase project is not paused
- Run schema.sql in Supabase SQL Editor

**Gemini API Errors:**
- Verify `GEMINI_API_KEY` is correct
- Check API quota at https://makersuite.google.com/

### Frontend Issues

**Cannot connect to backend:**
- Ensure backend is running: `curl http://localhost:5000/health`
- Check CORS configuration in `backend/app.py`
- Verify API_URL in frontend configuration

**Build Errors:**
```powershell
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

## 📚 API Documentation

### Orders Endpoints

**GET /api/orders** - Get all orders
**POST /api/orders** - Create new order
**POST /api/orders/generate** - Generate synthetic orders

### Load Optimization

**POST /api/loads/optimize**
```json
{
  "order_ids": ["ORD_00001", "ORD_00002"]
}
```

Returns optimized load plan with utilization metrics.

### Route Planning

**POST /api/routes/optimize**
```json
{
  "load_id": "LOAD_001"
}
```

Returns optimal route with stops and timing.

### Cost Analysis

**POST /api/costs/analyze**
```json
{
  "load_ids": ["LOAD_001", "LOAD_002"]
}
```

Returns cost breakdown and savings opportunities.

## 🎯 Next Steps

1. **Set up Supabase database** (run schema.sql)
2. **Configure environment variables** (create .env)
3. **Generate synthetic test data**
4. **Test load optimization**
5. **Build frontend components**
6. **Deploy to production**

## 📞 Support

For issues or questions:
- Check GitHub Issues
- Review API documentation
- Test with synthetic data first

---

**Happy Optimizing! 🚛📦**
