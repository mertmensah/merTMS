# Transportation Management System (TMS)

AI-powered logistics platform for optimizing freight operations, load planning, and route optimization.

## Features

### 📊 Dashboard
- Real-time analytics and KPIs
- Active shipments tracking
- Cost savings visualization
- Performance metrics

### 📦 Order Management
- Import orders from ERP systems
- Synthetic data generation for testing
- Order status tracking
- Priority management

### 🚛 Load Planning
- AI-powered load consolidation
- Multi-constraint optimization (weight, volume, cube)
- Truck type assignment
- Utilization optimization (target 80%+)

### 🗺️ Route Optimization
- Multi-stop route planning
- Hours of Service (HOS) compliance
- Fuel-efficient routing
- Time window management

### 💰 Cost Analysis
- Detailed cost breakdown
- Savings opportunity identification
- Carrier rate comparison
- ROI tracking

## Tech Stack

**Backend:**
- Python 3.11 + Flask 3.0
- Supabase (PostgreSQL)
- Google Gemini AI
- Pandas for data processing

**Frontend:**
- React 18
- Vite 5
- Axios
- TailwindCSS (planned)

**AI Agents:**
- Load Optimizer Agent
- Route Planner Agent
- Cost Analyzer Agent

## Architecture

```
ERP System → Synthetic Data Generator → Orders Database (Supabase)
                                              ↓
                                   TMS Backend (Flask)
                                              ↓
                            ┌─────────────────┴─────────────────┐
                            ↓                 ↓                 ↓
                   Load Optimizer    Route Planner    Cost Analyzer
                   (Gemini AI)       (Gemini AI)      (Gemini AI)
                            ↓                 ↓                 ↓
                            └─────────────────┬─────────────────┘
                                              ↓
                                   TMS Frontend (React)
                                              ↓
                                   Dashboard / Reports
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account (free tier)
- Google Gemini API key

### Setup

1. **Clone and configure backend:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. **Create `.env` file:**
```
GEMINI_API_KEY=your-gemini-key
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

3. **Start backend:**
```powershell
python app.py
```

4. **Install frontend:**
```powershell
cd frontend
npm install
npm run dev
```

## Database Schema

**Orders Table:**
- id, customer, origin, destination
- weight_lbs, volume_cuft, priority
- delivery_window_start, delivery_window_end
- created_at

**Loads Table:**
- id, load_number, truck_type
- total_weight, total_volume, utilization_percent
- origin, status, created_at

**Routes Table:**
- id, load_id, total_miles, total_drive_hours
- fuel_cost_estimate, efficiency_score
- created_at

## License

MIT
