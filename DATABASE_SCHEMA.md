# merTM.S Database Schema

> **PostgreSQL Database Architecture**  
> Complete entity-relationship diagram and table specifications for the Transportation Management System

---

## 📊 Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FREIGHT OPERATIONS DOMAIN                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   facilities     │
│──────────────────│
│ 🔑 id (UUID)     │◄─────────┐
│ facility_code    │          │
│ facility_name    │          │
│ facility_type    │          │  Foreign Keys
│ address          │          │
│ city             │          │
│ state_province   │          │
│ country          │          │
│ postal_code      │          │
│ latitude         │          │
│ longitude        │          │
│ created_at       │          │
│ updated_at       │          │
└──────────────────┘          │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        │                     │                     │
┌───────▼──────────┐   ┌──────▼──────────┐   ┌─────▼────────────┐
│   orders         │   │   loads         │   │   products       │
│──────────────────│   │─────────────────│   │──────────────────│
│ 🔑 id (UUID)     │   │ 🔑 id (UUID)    │   │ 🔑 id (UUID)     │
│ order_number     │   │ load_number     │   │ product_id       │
│ customer         │   │ truck_type      │   │ name             │
│ origin           │   │ total_weight    │   │ description      │
│ 🔗 origin_fac... │   │ total_volume    │   │ carton_length    │
│ destination      │   │ utilization_%   │   │ carton_width     │
│ 🔗 dest_fac...   │   │ origin          │   │ carton_height    │
│ weight_lbs       │   │ 🔗 origin_fac.. │   │ carton_weight    │
│ volume_cuft      │   │ status          │   │ units_per_pallet │
│ priority         │   │ created_at      │   │ is_hazmat        │
│ status           │   │ updated_at      │   │ hs_code          │
│ delivery_win...  │   │ estimated_del.. │   │ created_at       │
│ special_req...   │   └─────────────────┘   │ updated_at       │
│ created_at       │           │              └──────────────────┘
│ updated_at       │           │
│ estimated_del... │           │
└──────────────────┘           │
        │                      │
        │                      │
        │   ┌──────────────────┘
        │   │
        │   │   ┌────────────────────┐
        │   └──►│  load_orders       │◄──── Many-to-Many Junction
        │       │────────────────────│
        └──────►│ 🔑 id (UUID)       │
                │ 🔗 load_id         │
                │ 🔗 order_id        │
                │ sequence_number    │
                │ created_at         │
                └────────────────────┘

┌──────────────────┐         ┌────────────────────┐
│   carriers       │         │  cost_analysis     │
│──────────────────│         │────────────────────│
│ 🔑 id (UUID)     │         │ 🔑 id (UUID)       │
│ name             │         │ 🔗 load_id         │──┐
│ mc_number        │         │ base_freight_cost  │  │
│ dot_number       │         │ fuel_surcharge     │  │
│ contact_email    │         │ detention_fees     │  │
│ contact_phone    │         │ total_cost         │  │
│ rate_per_mile    │         │ cost_per_mile      │  │
│ truck_types[]    │         │ analysis_data      │  │  References
│ rating           │         │ created_at         │  │  loads.id
│ created_at       │         └────────────────────┘  │
│ updated_at       │                                 │
└──────────────────┘                 ┌───────────────┘
                                     │
                             ┌───────▼──────┐
                             │   loads      │
                             └──────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROJECT MANAGEMENT DOMAIN (Lean Six Sigma)               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│     people       │
│──────────────────│
│ 🔑 id (UUID)     │◄─────────┐
│ name             │          │
│ email            │          │
│ role             │          │
│ avatar           │          │
│ phone            │          │  Foreign Keys
│ department       │          │
│ is_active        │          │
│ created_at       │          │
│ updated_at       │          │
└──────────────────┘          │
        │                     │
        │                     │
        │   ┌─────────────────┼─────────────────────┐
        │   │                 │                     │
        │   │                 │                     │
┌───────▼───▼────┐   ┌────────▼────────┐   ┌───────▼──────────┐
│   projects     │   │ project_team... │   │   stories        │
│────────────────│   │─────────────────│   │──────────────────│
│ 🔑 id (UUID)   │◄──│ 🔑 id (UUID)    │   │ 🔑 id (UUID)     │
│ name           │   │ 🔗 project_id   │   │ 🔗 project_id    │
│ type           │   │ 🔗 person_id    │   │ title            │
│ status         │   │ role            │   │ description      │
│ sprint         │   │ joined_at       │   │ story_points     │
│ 🔗 owner_id    │   └─────────────────┘   │ status           │
│ start_date     │                         │ priority         │
│ target_date    │   Many-to-Many          │ 🔗 assignee_id   │
│ actual_comp... │   Junction              │ sprint           │
│ phase          │                         │ story_type       │
│ defect_rate    │                         │ acceptance_cri.. │
│ process_eff... │                         │ created_at       │
│ description    │                         │ updated_at       │
│ created_at     │                         │ completed_at     │
│ updated_at     │                         └──────────────────┘
└────────────────┘                                 │
        │                                          │
        │                                          │
        │   ┌──────────────────────────────────────┘
        │   │
        │   │   ┌────────────────────┐
        │   └──►│  action_items      │
        └──────►│────────────────────│
                │ 🔑 id (UUID)       │
                │ 🔗 story_id        │ (optional - can be standalone)
                │ 🔗 project_id      │
                │ title              │
                │ description        │
                │ 🔗 assignee_id     │
                │ status             │
                │ priority           │
                │ due_date           │
                │ completed_at       │
                │ created_at         │
                │ updated_at         │
                └────────────────────┘
```

---

## 📋 Table Specifications

### Freight Operations Domain

#### 🏭 `facilities`
**Purpose**: Master data for all physical locations (origins, destinations, warehouses, cross-docks)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `facility_code` | VARCHAR(50) | UNIQUE, NOT NULL | Short code (e.g., "CHI-DC1") |
| `facility_name` | VARCHAR(255) | NOT NULL | Full facility name |
| `facility_type` | VARCHAR(50) | NOT NULL | Type: 'origin', 'destination', 'warehouse', 'crossdock' |
| `address` | VARCHAR(255) | | Street address |
| `city` | VARCHAR(100) | NOT NULL | City name |
| `state_province` | VARCHAR(50) | | State/province code |
| `country` | VARCHAR(50) | NOT NULL | Country name or ISO code |
| `postal_code` | VARCHAR(20) | | ZIP/postal code |
| `latitude` | DECIMAL(10, 7) | NOT NULL | Geographic latitude |
| `longitude` | DECIMAL(11, 7) | NOT NULL | Geographic longitude |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_facilities_facility_type` on `facility_type`
- `idx_facilities_city` on `city`

---

#### 📦 `products`
**Purpose**: SKU master data with carton specifications for load planning

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `product_id` | VARCHAR(50) | UNIQUE, NOT NULL | SKU number |
| `name` | VARCHAR(255) | NOT NULL | Product name |
| `description` | TEXT | | Detailed description |
| `carton_length_in` | DECIMAL(10, 2) | NOT NULL | Carton length (inches) |
| `carton_width_in` | DECIMAL(10, 2) | NOT NULL | Carton width (inches) |
| `carton_height_in` | DECIMAL(10, 2) | NOT NULL | Carton height (inches) |
| `carton_weight_lbs` | DECIMAL(10, 2) | NOT NULL | Carton weight (pounds) |
| `units_per_pallet` | INTEGER | NOT NULL | Units that fit on one pallet |
| `is_hazmat` | BOOLEAN | DEFAULT FALSE | Hazardous materials flag |
| `hs_code` | VARCHAR(20) | | Harmonized System code for customs |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

---

#### 📋 `orders`
**Purpose**: Customer shipment requests awaiting consolidation into loads

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `order_number` | VARCHAR(50) | UNIQUE, NOT NULL | Order reference number |
| `customer` | VARCHAR(255) | NOT NULL | Customer name |
| `origin` | VARCHAR(255) | NOT NULL | Origin location text |
| `origin_facility_id` | UUID | FOREIGN KEY → facilities(id) | Origin facility reference |
| `destination` | VARCHAR(255) | NOT NULL | Destination location text |
| `destination_facility_id` | UUID | FOREIGN KEY → facilities(id) | Destination facility reference |
| `weight_lbs` | DECIMAL(10, 2) | NOT NULL | Total weight (pounds) |
| `volume_cuft` | DECIMAL(10, 2) | NOT NULL | Total volume (cubic feet) |
| `priority` | VARCHAR(20) | DEFAULT 'Normal' | Priority: 'Urgent', 'High', 'Normal', 'Low' |
| `status` | VARCHAR(50) | DEFAULT 'Pending' | Status: 'Pending', 'Assigned', 'In Transit', 'Delivered' |
| `delivery_window_start` | TIMESTAMP | | Earliest acceptable delivery time |
| `delivery_window_end` | TIMESTAMP | | Latest acceptable delivery time |
| `special_requirements` | TEXT | | Special handling notes |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| `estimated_delivery` | TIMESTAMP | | Calculated estimated delivery time |

**Indexes:**
- `idx_orders_origin_facility_id` on `origin_facility_id`
- `idx_orders_destination_facility_id` on `destination_facility_id`
- `idx_orders_status` on `status`
- `idx_orders_created_at` on `created_at`

---

#### 🚛 `loads`
**Purpose**: Consolidated shipments assigned to trucks

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `load_number` | VARCHAR(50) | UNIQUE, NOT NULL | Load reference number |
| `truck_type` | VARCHAR(50) | NOT NULL | Type: '53ft Dry Van', 'Reefer', 'Flatbed' |
| `total_weight_lbs` | DECIMAL(10, 2) | NOT NULL | Total consolidated weight |
| `total_volume_cuft` | DECIMAL(10, 2) | NOT NULL | Total consolidated volume |
| `utilization_percent` | DECIMAL(5, 2) | | Capacity utilization (0-100%) |
| `origin` | VARCHAR(255) | NOT NULL | Origin location text |
| `origin_facility_id` | UUID | FOREIGN KEY → facilities(id) | Origin facility reference |
| `status` | VARCHAR(50) | DEFAULT 'Planning' | Status: 'Planning', 'Dispatched', 'In Transit', 'Delivered' |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| `estimated_delivery` | TIMESTAMP | | Calculated estimated delivery time |

**Indexes:**
- `idx_loads_origin_facility_id` on `origin_facility_id`
- `idx_loads_status` on `status`

---

#### 🔗 `load_orders` (Junction Table)
**Purpose**: Many-to-many relationship between loads and orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `load_id` | UUID | FOREIGN KEY → loads(id) ON DELETE CASCADE | Load reference |
| `order_id` | UUID | FOREIGN KEY → orders(id) ON DELETE CASCADE | Order reference |
| `sequence_number` | INTEGER | | Delivery stop sequence |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**Constraints:**
- UNIQUE(`load_id`, `order_id`) - Each order can only be in a load once

**Indexes:**
- `idx_load_orders_load_id` on `load_id`
- `idx_load_orders_order_id` on `order_id`

---

#### 🚚 `carriers`
**Purpose**: Trucking company information and rate data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Carrier company name |
| `mc_number` | VARCHAR(50) | UNIQUE | FMCSA Motor Carrier number |
| `dot_number` | VARCHAR(50) | | USDOT number |
| `contact_email` | VARCHAR(255) | | Primary contact email |
| `contact_phone` | VARCHAR(50) | | Primary phone number |
| `rate_per_mile` | DECIMAL(5, 2) | | Average rate per mile |
| `truck_types` | TEXT[] | | Array of truck types offered |
| `rating` | DECIMAL(3, 2) | | Carrier rating (0.00-5.00) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

---

#### 💰 `cost_analysis`
**Purpose**: Financial breakdown and cost optimization data per load

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `load_id` | UUID | FOREIGN KEY → loads(id) ON DELETE CASCADE | Load reference |
| `base_freight_cost` | DECIMAL(10, 2) | | Base transportation cost |
| `fuel_surcharge` | DECIMAL(10, 2) | | Fuel surcharge amount |
| `detention_fees` | DECIMAL(10, 2) | | Detention/demurrage fees |
| `total_cost` | DECIMAL(10, 2) | | Total all-in cost |
| `cost_per_mile` | DECIMAL(5, 2) | | Cost efficiency metric |
| `analysis_data` | JSONB | | Detailed cost breakdown JSON |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

---

### Project Management Domain (Lean Six Sigma)

#### 👥 `people`
**Purpose**: Team members, users, and stakeholders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Full name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| `role` | VARCHAR(100) | NOT NULL | Role: 'Scrum Master', 'Product Owner', 'Developer', 'Six Sigma Black Belt', etc. |
| `avatar` | VARCHAR(10) | DEFAULT '👤' | Emoji avatar |
| `phone` | VARCHAR(50) | | Phone number |
| `department` | VARCHAR(100) | | Department name |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active status flag |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_people_email` on `email`
- `idx_people_is_active` on `is_active`

---

#### 📊 `projects`
**Purpose**: Lean Six Sigma DMAIC projects, Scrum sprints, Kanban initiatives

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Project name |
| `type` | VARCHAR(100) | NOT NULL | Type: 'Six Sigma DMAIC', 'Scrum', 'Kanban', 'Hybrid' |
| `status` | VARCHAR(50) | DEFAULT 'Planning' | Status: 'Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled' |
| `sprint` | VARCHAR(50) | | Current sprint identifier |
| `owner_id` | UUID | FOREIGN KEY → people(id) | Project owner/sponsor |
| `start_date` | DATE | | Project start date |
| `target_date` | DATE | | Target completion date |
| `actual_completion_date` | DATE | | Actual completion date |
| `phase` | VARCHAR(50) | | DMAIC phase: 'Define', 'Measure', 'Analyze', 'Improve', 'Control' |
| `defect_rate` | DECIMAL(5, 2) | | Six Sigma defect rate (%) |
| `process_efficiency` | DECIMAL(5, 2) | | Process efficiency percentage |
| `description` | TEXT | | Project description |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_projects_status` on `status`
- `idx_projects_owner` on `owner_id`

---

#### 👥🔗 `project_team_members` (Junction Table)
**Purpose**: Many-to-many relationship between projects and people

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `project_id` | UUID | FOREIGN KEY → projects(id) ON DELETE CASCADE | Project reference |
| `person_id` | UUID | FOREIGN KEY → people(id) ON DELETE CASCADE | Person reference |
| `role` | VARCHAR(100) | | Role within this specific project |
| `joined_at` | TIMESTAMP | DEFAULT NOW() | Team join timestamp |

**Constraints:**
- UNIQUE(`project_id`, `person_id`) - Each person can only be on a project once

---

#### 📝 `stories`
**Purpose**: User stories, tasks, bugs, and epics in Kanban/Scrum backlog

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `project_id` | UUID | FOREIGN KEY → projects(id) ON DELETE CASCADE | Project reference |
| `title` | VARCHAR(500) | NOT NULL | Story title |
| `description` | TEXT | | Detailed description |
| `story_points` | INTEGER | | Effort estimation (Fibonacci) |
| `status` | VARCHAR(50) | DEFAULT 'To Do' | Status: 'To Do', 'In Progress', 'Done', 'Blocked' |
| `priority` | VARCHAR(20) | DEFAULT 'Medium' | Priority: 'High', 'Medium', 'Low' |
| `assignee_id` | UUID | FOREIGN KEY → people(id) | Assigned team member |
| `sprint` | VARCHAR(50) | | Sprint identifier |
| `story_type` | VARCHAR(50) | DEFAULT 'User Story' | Type: 'User Story', 'Bug', 'Task', 'Epic' |
| `acceptance_criteria` | TEXT | | Definition of done |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| `completed_at` | TIMESTAMP | | Completion timestamp |

**Indexes:**
- `idx_stories_project` on `project_id`
- `idx_stories_assignee` on `assignee_id`
- `idx_stories_status` on `status`

---

#### ✅ `action_items`
**Purpose**: Actionable tasks with due dates and assignments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `story_id` | UUID | FOREIGN KEY → stories(id) ON DELETE CASCADE | Parent story (optional) |
| `project_id` | UUID | FOREIGN KEY → projects(id) ON DELETE CASCADE | Project reference |
| `title` | VARCHAR(500) | NOT NULL | Action item title |
| `description` | TEXT | | Detailed description |
| `assignee_id` | UUID | FOREIGN KEY → people(id) | Assigned person |
| `status` | VARCHAR(50) | DEFAULT 'Open' | Status: 'Open', 'In Progress', 'Completed', 'Blocked' |
| `priority` | VARCHAR(20) | DEFAULT 'Medium' | Priority level |
| `due_date` | DATE | | Due date |
| `completed_at` | TIMESTAMP | | Completion timestamp |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_action_items_assignee` on `assignee_id`
- `idx_action_items_status` on `status`

---

## 🔐 Security & Access Control

### Row Level Security (RLS)
All tables have RLS enabled with default "Allow All" policies for open access mode.

**Future Enhancement**: When multi-tenancy is implemented, RLS policies will be updated to:
- Filter data by `organization_id`
- Enforce role-based permissions (Admin, User, Viewer)
- Isolate data at the database level

### Current Policies
```sql
-- Example: facilities table
CREATE POLICY "Allow all operations on facilities" 
  ON facilities 
  FOR ALL 
  USING (true);
```

---

## 📈 Performance Optimization

### Indexing Strategy
All foreign keys have corresponding indexes for efficient JOIN operations:
- `facilities`: facility_type, city
- `orders`: origin_facility_id, destination_facility_id, status, created_at
- `loads`: origin_facility_id, status
- `load_orders`: load_id, order_id
- `people`: email, is_active
- `projects`: status, owner_id
- `stories`: project_id, assignee_id, status
- `action_items`: assignee_id, status

### Query Optimization Tips
1. **Use indexed columns in WHERE clauses** for best performance
2. **Avoid SELECT *** - specify only needed columns
3. **Leverage JSONB** in `cost_analysis.analysis_data` with GIN indexes for complex queries
4. **Use prepared statements** to prevent SQL injection and improve execution plan caching

---

## 🔄 Migration History

1. **Initial Schema** (`schema.sql`) - Core freight operations tables
2. **Estimated Delivery** (`migration_add_estimated_delivery.sql`) - Add delivery time tracking
3. **Project Management** (`migration_add_people_and_projects.sql`) - Add Lean Six Sigma tables
4. **Date Tracking** (`migration_add_date_tracking.sql`) - Enhanced timestamp fields

---

## 🚀 Future Schema Enhancements

### Planned Additions
- [ ] **multi_tenancy**: `organizations` table with organization_id in all tables
- [ ] **authentication**: Supabase Auth integration with user profiles
- [ ] **documents**: Repository for BOL, invoices, POD scans
- [ ] **tracking_events**: Real-time GPS location history
- [ ] **notifications**: Alert and notification management
- [ ] **audit_logs**: Complete change history for compliance
- [ ] **integrations**: Third-party system connection configs

---

## 📚 Related Documentation

- [README.md](README.md) - Platform overview and setup guide
- [backend/database/schema.sql](backend/database/schema.sql) - Executable SQL schema
- [backend/database/RUN_IN_SUPABASE_SQL_EDITOR.sql](backend/database/RUN_IN_SUPABASE_SQL_EDITOR.sql) - Quick setup script

---

**Last Updated**: January 4, 2026  
**Database Version**: PostgreSQL 15 (Supabase)  
**Schema Version**: 1.3
