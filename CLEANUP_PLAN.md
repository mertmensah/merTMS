# Project Cleanup & Reorganization Plan

## Files to Delete

### Backend Test & Development Files
```
backend/test_api.ps1
backend/test_ct_loads.py
backend/test_intent_classifier.py
backend/test_mertsights_api.ps1
backend/test_models.py
backend/test_orders_coords.py
backend/test_system.py
backend/quick_test.py
backend/check_junction.py
backend/seed_control_tower_loads.py
backend/seed_facilities.py
backend/seed_today_loads.py
backend/apply_migration_estimated_delivery.py
backend/create_products_table.py
backend/0.3.2 (unknown file)
```

### Unused crewAI Files (using lightweight versions)
```
backend/agents/customer_support_crew.py
backend/agents/operations_intelligence_crew.py
```

### Wrong Location (Frontend deps in Backend)
```
backend/node_modules/ (entire folder)
backend/package.json
backend/package-lock.json
```

### Wrong Virtual Environment Name
```
backend/venv/ (should be .venv or excluded)
```

### Cache Folders (auto-generated)
```
backend/__pycache__/
backend/agents/__pycache__/
backend/config/__pycache__/
backend/database/__pycache__/
backend/utils/__pycache__/
```

## Documentation Consolidation

### Keep (Primary Docs):
- README.md (main entry point)
- DEPLOYMENT_GUIDE.md (deployment instructions)
- DATABASE_SCHEMA.md (schema reference)
- .env.example (environment template)

### Move to /docs folder:
- API_KEY_ROTATION_GUIDE.md
- AUTH_SETUP.md
- CONTROL_TOWER_SETUP.md
- KEEP_ALIVE_SUMMARY.md
- MAPBOX_SETUP.md
- MAPBOX_UPGRADE_COMPLETE.md
- PROJECT_SUMMARY.md
- QUICK_DEPLOY.md
- SETUP_GUIDE.md
- SUPABASE_KEEP_ALIVE.md

### Delete (Redundant/Outdated):
- RESTART_BACKEND.bat (outdated - using Render)
- START_TMS.bat (outdated - using Render)

## Proposed New Structure

```
TMS-Project/
├── README.md
├── DEPLOYMENT_GUIDE.md
├── DATABASE_SCHEMA.md
├── .env.example
├── .gitignore
├── render.yaml
├── runtime.txt
├── build.sh
├── docs/                          # 📁 NEW: All setup guides
│   ├── API_KEY_ROTATION_GUIDE.md
│   ├── AUTH_SETUP.md
│   ├── CONTROL_TOWER_SETUP.md
│   ├── KEEP_ALIVE_SUMMARY.md
│   ├── MAPBOX_SETUP.md
│   ├── PROJECT_SUMMARY.md
│   ├── QUICK_DEPLOY.md
│   ├── SETUP_GUIDE.md
│   └── SUPABASE_KEEP_ALIVE.md
├── backend/
│   ├── .env.example
│   ├── app.py
│   ├── requirements.txt
│   ├── runtime.txt
│   ├── agents/
│   │   ├── base_agent.py
│   │   ├── control_tower_simulator.py
│   │   ├── cost_analyzer.py
│   │   ├── customer_support_lightweight.py  # ✅ ACTIVE
│   │   ├── load_optimizer.py
│   │   ├── mertsights_ai.py
│   │   ├── operations_intelligence_lightweight.py  # ✅ ACTIVE
│   │   ├── platform_assistant.py
│   │   ├── query_agent.py
│   │   ├── query_agent_tools.py
│   │   └── route_planner.py
│   ├── config/
│   │   └── settings.py
│   ├── database/
│   │   ├── supabase_client.py
│   │   └── migrations/          # 📁 NEW: SQL migrations
│   │       ├── create_execute_sql_function.sql
│   │       ├── migration_add_date_tracking.sql
│   │       ├── migration_add_estimated_delivery.sql
│   │       ├── migration_add_people_and_projects.sql
│   │       ├── RUN_IN_SUPABASE_SQL_EDITOR.sql
│   │       ├── schema.sql
│   │       ├── schema_optimized.sql
│   │       └── seed_facilities.sql
│   ├── nemotron-ocr-v1/
│   └── utils/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       └── styles/
└── supabase/
    ├── config.toml
    ├── seed.sql
    ├── functions/
    └── migrations/
```

## Actions Required

1. ✅ Create `/docs` folder
2. ✅ Move documentation files
3. ✅ Delete test files
4. ✅ Delete unused crewAI files
5. ✅ Delete backend node_modules
6. ✅ Create `backend/database/migrations/` folder
7. ✅ Move SQL files to migrations
8. ✅ Update .gitignore
9. ✅ Commit cleanup
