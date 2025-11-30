# GitHub Copilot Instructions

Welcome to the TMS (Transportation Management System) project!

## Project Setup Checklist

- [x] **Step 1: Verify**: Confirm all project files are in place
- [ ] **Step 2: Clarify**: Review project requirements and architecture
- [ ] **Step 3: Scaffold**: Backend and frontend structure created
- [ ] **Step 4: Customize**: Configure environment variables (.env)
- [ ] **Step 5: Extensions**: Install recommended VS Code extensions
- [ ] **Step 6: Compile**: Install dependencies (pip install, npm install)
- [ ] **Step 7: Task**: Create tasks.json for easy run/build
- [ ] **Step 8: Launch**: Start both backend and frontend servers
- [ ] **Step 9: Documentation**: Update README with usage examples

## Quick Start Commands

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

## Architecture Overview

- **Backend**: Flask REST API with Supabase PostgreSQL
- **Frontend**: React 18 + Vite 5
- **AI Agents**: Multi-agent system for load optimization, route planning, cost analysis
- **Database**: Supabase (free PostgreSQL with 2GB storage)
