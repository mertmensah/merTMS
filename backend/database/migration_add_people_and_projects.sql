-- Migration: Add People and Project Management Tables
-- Date: 2025-12-26
-- Description: Add tables for Lean Six Sigma Scrum project management

-- People Table (Team Members & Users)
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(100) NOT NULL, -- 'Scrum Master', 'Product Owner', 'Developer', 'Six Sigma Black Belt', etc.
    avatar VARCHAR(10) DEFAULT '👤',
    phone VARCHAR(50),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'Six Sigma DMAIC', 'Scrum', 'Kanban', etc.
    status VARCHAR(50) DEFAULT 'Planning', -- 'Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'
    sprint VARCHAR(50),
    owner_id UUID REFERENCES people(id),
    start_date DATE,
    target_date DATE,
    actual_completion_date DATE,
    phase VARCHAR(50), -- DMAIC phases: 'Define', 'Measure', 'Analyze', 'Improve', 'Control'
    defect_rate DECIMAL(5, 2), -- Six Sigma defect rate
    process_efficiency DECIMAL(5, 2), -- Process efficiency percentage
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Project Team Members (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS project_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    role VARCHAR(100), -- Role in this specific project
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, person_id)
);

-- User Stories / Tasks
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    story_points INTEGER,
    status VARCHAR(50) DEFAULT 'To Do', -- 'To Do', 'In Progress', 'Done', 'Blocked'
    priority VARCHAR(20) DEFAULT 'Medium', -- 'High', 'Medium', 'Low'
    assignee_id UUID REFERENCES people(id),
    sprint VARCHAR(50),
    story_type VARCHAR(50) DEFAULT 'User Story', -- 'User Story', 'Bug', 'Task', 'Epic'
    acceptance_criteria TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Action Items (Linked to stories or standalone)
CREATE TABLE IF NOT EXISTS action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES people(id),
    status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'In Progress', 'Completed', 'Blocked'
    priority VARCHAR(20) DEFAULT 'Medium',
    due_date DATE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);
CREATE INDEX IF NOT EXISTS idx_people_is_active ON people(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_stories_project ON stories(project_id);
CREATE INDEX IF NOT EXISTS idx_stories_assignee ON stories(assignee_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_action_items_assignee ON action_items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);

-- Enable Row Level Security (RLS)
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (Allow all for now - you can restrict later)
CREATE POLICY "Allow all operations on people" ON people FOR ALL USING (true);
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on project_team_members" ON project_team_members FOR ALL USING (true);
CREATE POLICY "Allow all operations on stories" ON stories FOR ALL USING (true);
CREATE POLICY "Allow all operations on action_items" ON action_items FOR ALL USING (true);

-- Insert sample data
INSERT INTO people (name, email, role, avatar) VALUES
('John Smith', 'john@optisc.com', 'Scrum Master', '👨‍💼'),
('Sarah Johnson', 'sarah@optisc.com', 'Product Owner', '👩‍💼'),
('Mike Chen', 'mike@optisc.com', 'Developer', '👨‍💻'),
('Emma Davis', 'emma@optisc.com', 'Six Sigma Black Belt', '👩‍🔬')
ON CONFLICT (email) DO NOTHING;

-- Insert sample project
INSERT INTO projects (name, type, status, sprint, phase, defect_rate, process_efficiency, start_date, target_date, description)
VALUES (
    'TMS Process Optimization',
    'Six Sigma DMAIC',
    'In Progress',
    'Sprint 3',
    'Measure',
    3.4,
    87,
    '2025-12-01',
    '2026-02-28',
    'Optimize the TMS load planning process using Lean Six Sigma methodologies'
)
ON CONFLICT DO NOTHING;
