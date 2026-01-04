# merTM.S - Enterprise Transportation Management System

> **AI-Powered Logistics Intelligence Platform**  
> Comprehensive TMS combining freight optimization, project management, and intelligent automation for modern supply chain operations.

---

## 🚀 **Try It Now - No Installation Required!**

### **Live Platform:** [https://mertmensah.github.io/merTMS/](https://mertmensah.github.io/merTMS/)

**👉 Click the link above to start using the platform immediately in your browser**

> **⚡ First-time users:** The backend server may take 30-60 seconds to wake up on first visit. If you see connection errors, wait a moment and refresh the page.

---

## 📖 **How to Use the Platform** (5-Minute Quick Start)

### **Step 1: Wake Up the Backend** ⏰
The platform uses a free hosting tier that sleeps after inactivity.
- Click this link first: [Backend API](https://mertms-nwh7.onrender.com) 
- Wait for the page to load (30-60 seconds)
- You'll see a simple "TMS Backend is running" message
- ✅ Backend is ready when you see this message

### **Step 2: Open the Platform** 🌐
- Go to: [https://mertmensah.github.io/merTMS/](https://mertmensah.github.io/merTMS/)
- You'll see the Dashboard with navigation on the left
- All features are ready to explore - **no login required!**

### **Step 3: Generate Sample Data** 📦
To see the platform in action:
1. Click **"Order Management"** in the left sidebar
2. Scroll down and click **"Generate Synthetic Orders"**
3. Choose a quantity (start with **50 orders** recommended)
4. Click **"Generate"** and wait ~10 seconds
5. ✅ You'll see a table of orders appear

### **Step 4: Optimize Loads with AI** 🤖
Let AI consolidate orders into efficient truck loads:
1. Click **"Load Builder"** in the left sidebar
2. Review the pending orders shown
3. Click the blue **"🤖 Optimize Loads"** button at the top
4. AI will process for ~15 seconds
5. ✅ See optimized loads with utilization metrics

### **Step 5: View Live Tracking** 🗺️
See loads on a satellite map:
1. Click **"Control Tower"** in the left sidebar
2. Click **"🎬 Simulate Loads"** button (generates test deliveries)
3. ✅ Watch color-coded markers appear on the Mapbox satellite view:
   - 🟢 **Green** = On Time
   - 🟠 **Orange** = At Risk
   - 🔴 **Red** = Delayed
4. Click any marker for detailed information
5. Switch map styles using the 4 buttons at the top

### **What You Can Explore:**

| Module | What It Does | Try This |
|--------|-------------|----------|
| 📊 **Dashboard** | Real-time KPIs and metrics | View active shipments and cost savings |
| 📦 **Order Management** | Create and manage shipment requests | Generate synthetic orders, filter by status |
| 🚛 **Load Builder** | AI-powered load consolidation | Optimize pending orders into efficient loads |
| 🗺️ **Control Tower** | Live tracking with satellite imagery | Simulate loads, view on map, click markers |
| 📈 **Project Management** | Lean Six Sigma Kanban boards | Create projects, add stories, drag between columns |
| 🤖 **Automation Hub** | AI agent marketplace | View available agents, check status |
| 💬 **MertSights AI** | Chat assistant for TMS operations | Ask questions about your data |
| 🏭 **Facilities** | Manage warehouse locations | Browse origins and destinations |
| 📦 **Products** | SKU catalog with dimensions | View product specifications |

---

## 🔓 **Open Access Mode**

The platform is currently accessible **without authentication** to allow everyone to explore and test all features. 

**What this means:**
- ✅ No signup or login required
- ✅ Full access to all modules
- ⚠️ Data is shared across all users (public test environment)
- ⚠️ Data may be reset periodically

**Future Update:** Multi-tenant authentication is planned (see Roadmap below) for production use with isolated, secure data per organization.

---

## 📋 Platform Overview

**merTM.S** is an enterprise-grade Transportation Management System that integrates AI-powered logistics optimization with agile project management frameworks (Lean Six Sigma, Scrum) and intelligent automation capabilities. The platform serves as a unified hub for managing freight operations, optimizing supply chain networks, and executing operational excellence initiatives.

### Core Capabilities

🚛 **Freight Operations** - End-to-end load planning, routing, and cost optimization  
📊 **Real-Time Control Tower** - Live tracking with Mapbox satellite imagery integration  
🤖 **AI Automation Hub** - Intelligent agents for load optimization and cost analysis  
📈 **Project Management** - Lean Six Sigma DMAIC, Scrum Kanban boards, team collaboration  
🗺️ **Network Engineering** - Facility management, geospatial analysis, lane optimization  
📄 **Document Intelligence** - OCR-powered document processing (Nemotron Vision API)  
💬 **MertSights AI** - Natural language assistant for platform operations

---

## ✨ Feature Modules

### 📊 Dashboard & Analytics
- **Real-time KPIs**: Active shipments, pending orders, cost savings, efficiency metrics
- **Performance Trends**: Historical data visualization with time-series analysis
- **Operational Health**: System status monitoring and alert management
- **Executive Summary**: High-level insights for decision makers

### 📦 Order Management
- **ERP Integration Ready**: Import orders from external systems via API
- **Synthetic Data Generation**: Built-in test data generator for development
- **Status Tracking**: Pending → Assigned → In Transit → Delivered workflow
- **Bulk Operations**: Multi-order selection and batch processing
- **Priority Management**: Urgent, High, Normal, Low categorization
- **Delivery Windows**: Time-based constraints for route planning

### 🚛 Load Builder & Planning
- **AI-Powered Consolidation**: Intelligent order-to-load assignment using Google Gemini
- **Multi-Constraint Optimization**: Weight, volume, cube utilization analysis
- **Truck Type Assignment**: 53ft Dry Van, Reefer, Flatbed compatibility
- **Target Utilization**: 80%+ fill rate optimization
- **Visual Load Builder**: Drag-and-drop interface for manual adjustments
- **Saved Load Management**: Database persistence for planned loads

### 🗺️ Control Tower (Real-Time Monitoring)
- **Mapbox Satellite Integration**: High-resolution imagery with 4 map styles
  - Custom styled view
  - Satellite streets
  - Standard streets
  - Dark mode
- **Live Load Tracking**: Color-coded markers (🟢 Green = On Time, 🟠 Orange = At Risk, 🔴 Red = Delayed)
- **Interactive Popups**: Detailed load information on marker click
- **Load Simulation**: Generate test deliveries with realistic coordinates
- **Navigation Controls**: Zoom, fullscreen, layer switching
- **Multi-Country View**: Global facility network visualization

### 🛣️ Route Optimization
- **Multi-Stop Planning**: Sequential stop optimization algorithms
- **Hours of Service (HOS)**: DOT compliance for drive time regulations
- **Fuel Cost Estimation**: Distance-based cost modeling
- **Time Window Validation**: Delivery constraint satisfaction
- **Efficiency Scoring**: Route quality metrics and recommendations
- **Turn-by-Turn Directions**: Planned for future integration

### 💰 Cost Analysis & Reporting
- **Detailed Cost Breakdown**: Base freight, fuel surcharge, accessorial fees
- **Savings Identification**: Consolidation opportunities and optimization potential
- **Carrier Rate Comparison**: Multi-carrier bidding simulation
- **ROI Tracking**: Investment return calculations for optimization initiatives
- **Cost Per Mile Metrics**: Efficiency benchmarking

### 🏭 Facilities & Network
- **Facility Management**: Origins, destinations, warehouses, cross-docks
- **Geolocation Data**: Lat/long coordinates for all locations
- **Capacity Planning**: Volume projections and throughput analysis
- **Lane Management**: Origin-destination pair performance
- **Coverage Analysis**: Service area mapping

### 📦 Product Catalog
- **SKU Management**: Product master data with dimensions and weights
- **Carton Specifications**: Length, width, height, weight tracking
- **Pallet Configuration**: Units per pallet for load planning
- **Hazmat Flags**: Special handling requirements
- **HS Codes**: Customs classification for international shipments

### 🤖 Automation Hub
- **AI Agent Marketplace**: Pre-configured intelligent agents
  - **Load Optimizer**: Consolidate orders into efficient loads
  - **Route Planner**: Calculate optimal delivery sequences
  - **Cost Analyzer**: Identify savings opportunities
  - **Platform Assistant**: Natural language operations interface
- **Agent Status Monitoring**: Active/idle state tracking
- **Quick Actions**: One-click agent invocation
- **Performance Metrics**: Agent efficiency and success rates

### 📄 AI Docuscan
- **Document Upload**: Drag-and-drop interface for PDFs, images
- **OCR Processing**: Text extraction using NVIDIA Nemotron Vision API
- **Structured Data Extraction**: Automatic field detection (order numbers, addresses, quantities)
- **Document Types**: BOL, invoices, packing lists, quotes
- **Validation**: Data quality checks and error handling

### 💬 MertSights AI Assistant
- **Natural Language Interface**: Chat-based interaction with TMS data
- **Contextual Awareness**: Understands platform state and user intent
- **Data Queries**: "Show me orders from Chicago to Atlanta"
- **Action Execution**: "Optimize all pending loads from Texas"
- **Explanations**: "Why was order #12345 assigned to Load #67890?"
- **Google Gemini Integration**: Advanced language understanding

### 📈 Project Management (Operational Excellence)
- **Lean Six Sigma DMAIC Tracking**: Define, Measure, Analyze, Improve, Control phases
- **Scrum Kanban Board**: Visual workflow management (To Do, In Progress, Done, Blocked)
- **Product Backlog**: Prioritized feature and improvement lists
- **People & Teams**: Team member management and role assignment
- **Sprint Management**: Time-boxed iteration planning
- **Action Items**: Task tracking with due dates and assignments
- **Six Sigma Metrics**: Defect rates, process efficiency, cycle times
- **Auto-Refresh**: Real-time collaboration with 30-second sync

### 🗺️ Network Engineering
- **Facility Network Design**: Strategic location planning
- **Lane Analysis**: Volume, cost, and performance by origin-destination pair
- **Coverage Maps**: Service area visualization
- **Optimization Recommendations**: Network improvement suggestions

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Python 3.11
- **Framework**: Flask 3.0 (REST API)
- **Database**: Supabase (PostgreSQL 15)
- **AI Engine**: Google Gemini 2.0 Flash
- **OCR**: NVIDIA Nemotron Vision API
- **Data Processing**: Pandas, NumPy
- **HTTP Client**: Axios (for Supabase integration)

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.21
- **HTTP Client**: Axios 1.13.2
- **Mapping**: Mapbox GL JS 3.17.0 (satellite imagery)
- **Styling**: CSS3 with Design Tokens system
- **State Management**: React Hooks (useState, useEffect, useRef)

### Infrastructure
- **Frontend Hosting**: GitHub Pages
- **Backend Hosting**: Render.com (Free Tier)
- **Database Hosting**: Supabase (Free Tier - 500MB database, 2GB bandwidth)
- **CI/CD**: Git push-based deployment
- **Version Control**: GitHub

### AI Agents Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    TMS Frontend (React)                     │
│  Dashboard | Orders | Loads | Routes | Control Tower       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS REST API
┌──────────────────────▼──────────────────────────────────────┐
│                 TMS Backend (Flask)                         │
│  • Order Management APIs   • Load Planning APIs             │
│  • Route Optimization APIs • Cost Analysis APIs             │
│  • Project Management APIs • Facility APIs                  │
└──────────┬──────────────────┬──────────────────────────────┘
           │                  │
           ▼                  ▼
  ┌────────────────┐   ┌──────────────────────────┐
  │   Supabase     │   │   Google Gemini API      │
  │  PostgreSQL    │   │   (AI Agent Engine)      │
  │                │   │                          │
  │  • Orders      │   │  • Load Optimizer Agent  │
  │  • Loads       │   │  • Route Planner Agent   │
  │  • Facilities  │   │  • Cost Analyzer Agent   │
  │  • Products    │   │  • Platform Assistant    │
  │  • Projects    │   │  • Intent Classifier     │
  │  • People      │   │  • MertSights AI Chat    │
  └────────────────┘   └──────────────────────────┘
```

### Data Flow Architecture
```
External ERP/WMS → Synthetic Data Generator → Orders Table
                                                    ↓
                                          Order Management UI
                                                    ↓
                                    AI Load Optimizer (Gemini)
                                                    ↓
                           ┌────────────────────────┴──────┐
                           ▼                               ▼
                    Loads Table ← Load Builder → Load Planning UI
                           ↓
                    Route Planner Agent (Gemini)
                           ↓
                    Cost Analyzer Agent (Gemini)
                           ↓
                    Control Tower (Mapbox Live View)
```

---

## 📊 Database Architecture

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for detailed entity-relationship diagram and table specifications.

### Core Tables
- **facilities**: Origins, destinations, warehouses with geolocation
- **products**: SKU master data with dimensions and weights
- **orders**: Customer shipment requests (status: Pending → Assigned)
- **loads**: Consolidated shipments assigned to trucks
- **load_orders**: Many-to-many junction table (orders ↔ loads)
- **carriers**: Trucking companies and rate information
- **cost_analysis**: Financial breakdown per load

### Project Management Tables (Lean Six Sigma)
- **people**: Team members, roles, contact information
- **projects**: DMAIC projects, Scrum sprints, status tracking
- **project_team_members**: Many-to-many (projects ↔ people)
- **stories**: User stories, tasks, bugs (Kanban cards)
- **action_items**: Task tracking with due dates and assignments

---

## 🚀 Getting Started (For Developers)

> **👤 Just want to use the platform?** Scroll up to the [How to Use](#-how-to-use-the-platform-5-minute-quick-start) section - no installation needed!

> **👨‍💻 Want to run your own instance or contribute?** Follow the instructions below.

### Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: 18.x or higher
- **Supabase Account**: Free tier at [supabase.com](https://supabase.com)
- **Google AI Studio**: Get free Gemini API key at [ai.google.dev](https://ai.google.dev)
- **Mapbox Account**: Get access token at [mapbox.com](https://mapbox.com) (50K free map loads/month)

### Backend Setup

1. **Clone repository:**
```powershell
git clone https://github.com/mertmensah/merTMS.git
cd merTMS/backend
```

2. **Create Python virtual environment:**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows PowerShell
# OR
source venv/bin/activate      # macOS/Linux
source venv/bin/activate      # macOS/Linux
```

3. **Install dependencies:**
```powershell
pip install -r requirements.txt
```

4. **Configure environment variables:**  
Create a `.env` file in the `backend/` directory:
```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here

# Optional: Backend Port
PORT=5000
```

5. **Initialize database:**  
Run the SQL schema in your Supabase SQL Editor:
```sql
-- Navigate to: Supabase Dashboard → SQL Editor → New Query
-- Copy and paste contents of: backend/database/schema.sql
-- Then run the migration files in order:
-- 1. migration_add_estimated_delivery.sql
-- 2. migration_add_people_and_projects.sql
```

6. **Start backend server:**
```powershell
python app.py
# Server will start at http://localhost:5000
```

### Frontend Setup

1. **Navigate to frontend directory:**
```powershell
cd ../frontend  # From backend directory
# OR
cd frontend     # From repository root
```

2. **Install Node.js dependencies:**
```powershell
npm install
```

3. **Configure environment variables:**  
Create a `.env` file in the `frontend/` directory:
```env
# Backend API URL
VITE_API_URL=http://localhost:5000

# Mapbox Token (Get from mapbox.com - free 50K loads/month)
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

4. **Start development server:**
```powershell
npm run dev
# Frontend will start at http://localhost:5173
```

5. **Build for production:**
```powershell
npm run build
# Output will be in frontend/dist/
```

### Quick Start Scripts

For convenience, use the batch scripts in the project root:

**Windows:**
```powershell
.\START_TMS.bat          # Start both backend and frontend
.\RESTART_BACKEND.bat    # Restart backend only
```

---

## 📖 Usage Guide

### 1. Generate Sample Data
- Navigate to **Order Management** module
- Click **"Generate Synthetic Orders"**
- Select quantity (10, 50, 100, 500)
- Orders will populate with realistic data

### 2. Optimize Loads
- Go to **Load Builder** module  
- Review pending orders in the table
- Click **"🤖 Optimize Loads"** button
- AI agent will consolidate orders into efficient loads
- Results display with utilization metrics

### 3. Monitor Operations
- Open **Control Tower** module
- Click **"🎬 Simulate Loads"** to generate test deliveries
- View color-coded markers on Mapbox satellite view:
  - 🟢 Green = On Time
  - 🟠 Orange = At Risk  
  - 🔴 Red = Delayed
- Click markers for detailed load information
- Switch between 4 map styles using top buttons

### 4. Manage Projects
- Access **Project Management** module
- Create new projects (Lean Six Sigma DMAIC, Scrum, Kanban)
- Add user stories to Product Backlog
- Drag cards between Kanban columns (To Do → In Progress → Done)
- Assign team members and track metrics
- Auto-refresh keeps data synchronized

### 5. Chat with AI
- Click **MertSights AI** in the navigation
- Ask questions: *"How many pending orders from Texas?"*
- Execute actions: *"Show me all loads over 40,000 lbs"*
- Get explanations: *"Why is Load #123 marked as at-risk?"*

---

## 🗺️ Roadmap

### ✅ Completed (Phase 1)
- [x] Core TMS modules (Orders, Loads, Routes, Cost Analysis)
- [x] AI agent integration (Google Gemini)
- [x] Mapbox satellite view with live tracking
- [x] Project Management with Lean Six Sigma frameworks
- [x] Automation Hub with pre-configured agents
- [x] MertSights AI natural language assistant
- [x] Responsive design system with design tokens
- [x] Real-time data synchronization
- [x] Supabase database with full schema
- [x] GitHub Pages deployment

### 🚧 In Progress (Phase 2)
- [ ] **User Authentication & Multi-Tenancy**
  - Supabase Auth integration
  - Email/password + OAuth (Google, GitHub, Microsoft)
  - Organization management
  - Domain-based auto-assignment (@company.com → Company org)
  - Row Level Security (RLS) for data isolation
  - Role-based access control (Admin, User, Viewer)
  
- [ ] **Document Intelligence**
  - NVIDIA Nemotron OCR integration
  - Automatic BOL/invoice data extraction
  - Document repository with search
  
- [ ] **Advanced Analytics**
  - Custom dashboard builder
  - Export reports (PDF, Excel)
  - Scheduled email reports
  - Predictive analytics for demand forecasting

### 🔮 Future (Phase 3)
- [ ] **Mobile App** (React Native)
- [ ] **Real-Time GPS Tracking** (IoT device integration)
- [ ] **Blockchain for BOL** (Immutable shipment records)
- [ ] **Machine Learning Models** (Custom demand prediction)
- [ ] **Integration Marketplace** (SAP, Oracle, Microsoft Dynamics connectors)
- [ ] **3D Warehouse Visualization** (Three.js for facility layouts)
- [ ] **Carbon Footprint Tracking** (Sustainability metrics)
- [ ] **Driver Mobile App** (Load acceptance, status updates, POD)

---

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Detailed installation instructions
- [Database Schema](DATABASE_SCHEMA.md) - Complete ERD and table definitions
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Production deployment steps
- [Mapbox Setup](MAPBOX_SETUP.md) - Map integration configuration
- [Project Summary](PROJECT_SUMMARY.md) - Feature overview and architecture
- [Quick Deploy](QUICK_DEPLOY.md) - Fast deployment checklist

---

## 🤝 Contributing

Contributions are welcome! This is an open-source project designed for learning and experimentation.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards
- **Python**: Follow PEP 8 style guide
- **JavaScript**: Use ESLint configuration provided
- **CSS**: Follow BEM naming convention
- **Commits**: Use conventional commit messages

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini** - AI agent intelligence
- **Supabase** - PostgreSQL database and authentication
- **Mapbox** - Satellite imagery and mapping
- **NVIDIA** - Nemotron Vision API for OCR
- **React & Vite** - Frontend framework and build tooling
- **Flask** - Python web framework

---

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/mertmensah/merTMS/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/mertmensah/merTMS/discussions)
- **Email**: [Contact repository owner](https://github.com/mertmensah)

---

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐ on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=mertmensah/merTMS&type=Date)](https://star-history.com/#mertmensah/merTMS&Date)

---

**Built with ❤️ for the logistics and supply chain community**
