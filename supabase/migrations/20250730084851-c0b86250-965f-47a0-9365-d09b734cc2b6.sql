-- Add missing columns to various tables and create seed data

-- Add missing columns to tables
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS spent NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS remaining_budget NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE project_phases ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 0;
ALTER TABLE project_phases ADD COLUMN IF NOT EXISTS spent NUMERIC DEFAULT 0;
ALTER TABLE project_phases ADD COLUMN IF NOT EXISTS material_cost NUMERIC DEFAULT 0;
ALTER TABLE project_phases ADD COLUMN IF NOT EXISTS labour_cost NUMERIC DEFAULT 0;

ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS is_done BOOLEAN DEFAULT false;

-- Update task workers foreign key name to match what the code expects
-- First, let's check if the foreign key exists with the expected name
DO $$
BEGIN
    -- Add constraint with the expected name if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_task_workers_user_id' 
        AND table_name = 'task_workers'
    ) THEN
        ALTER TABLE task_workers 
        ADD CONSTRAINT fk_task_workers_user_id 
        FOREIGN KEY (user_id) REFERENCES profiles(id);
    END IF;
END $$;

-- Create organization if it doesn't exist
INSERT INTO organizations (id, name) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Default Organization')
ON CONFLICT (id) DO NOTHING;

-- Create admin user profile (will be used as fallback)
INSERT INTO profiles (
    id, 
    organization_id, 
    auth_user_id, 
    name, 
    full_name,
    role, 
    is_placeholder
) VALUES (
    'fad8b1dd-a2d8-4699-8230-349bd110cd18',
    '00000000-0000-0000-0000-000000000000',
    'fad8b1dd-a2d8-4699-8230-349bd110cd18',
    'Admin User',
    'Admin User',
    'admin',
    false
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    name = COALESCE(profiles.name, 'Admin User'),
    full_name = COALESCE(profiles.full_name, 'Admin User'),
    is_placeholder = false;

-- Create some sample projects
INSERT INTO projects (
    id,
    organization_id,
    name,
    description,
    status,
    manager_id,
    start_date,
    end_date,
    budget
) VALUES 
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Office Building Construction',
    'Modern office building construction project',
    'active',
    'fad8b1dd-a2d8-4699-8230-349bd110cd18',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 months',
    500000
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Residential Complex Renovation',
    'Complete renovation of residential complex',
    'active',
    'fad8b1dd-a2d8-4699-8230-349bd110cd18',
    CURRENT_DATE - INTERVAL '1 month',
    CURRENT_DATE + INTERVAL '4 months',
    250000
) ON CONFLICT DO NOTHING;

-- Get the project IDs for creating phases and tasks
DO $$
DECLARE
    office_project_id UUID;
    residential_project_id UUID;
    phase_id UUID;
BEGIN
    -- Get project IDs
    SELECT id INTO office_project_id FROM projects WHERE name = 'Office Building Construction' LIMIT 1;
    SELECT id INTO residential_project_id FROM projects WHERE name = 'Residential Complex Renovation' LIMIT 1;
    
    -- Create phases for office building
    IF office_project_id IS NOT NULL THEN
        INSERT INTO project_phases (
            id, organization_id, project_id, name, description, status, budget
        ) VALUES 
        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', office_project_id, 'Foundation', 'Foundation and site preparation', 'in-progress', 100000),
        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', office_project_id, 'Structure', 'Main building structure', 'pending', 200000),
        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', office_project_id, 'Finishing', 'Interior finishing work', 'pending', 150000)
        ON CONFLICT DO NOTHING;
        
        -- Get foundation phase ID and create some tasks
        SELECT id INTO phase_id FROM project_phases WHERE project_id = office_project_id AND name = 'Foundation' LIMIT 1;
        
        IF phase_id IS NOT NULL THEN
            INSERT INTO tasks (
                organization_id, project_id, phase_id, title, description, status, priority, assigned_to
            ) VALUES 
            ('00000000-0000-0000-0000-000000000000', office_project_id, phase_id, 'Site Survey', 'Complete site survey and measurements', 'completed', 'high', 'fad8b1dd-a2d8-4699-8230-349bd110cd18'),
            ('00000000-0000-0000-0000-000000000000', office_project_id, phase_id, 'Excavation', 'Excavate foundation area', 'in-progress', 'high', 'fad8b1dd-a2d8-4699-8230-349bd110cd18'),
            ('00000000-0000-0000-0000-000000000000', office_project_id, phase_id, 'Foundation Pouring', 'Pour concrete foundation', 'pending', 'medium', 'fad8b1dd-a2d8-4699-8230-349bd110cd18')
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    -- Create phases for residential project
    IF residential_project_id IS NOT NULL THEN
        INSERT INTO project_phases (
            id, organization_id, project_id, name, description, status, budget
        ) VALUES 
        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', residential_project_id, 'Demolition', 'Demolition of old structures', 'completed', 50000),
        (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', residential_project_id, 'Renovation', 'Main renovation work', 'in-progress', 150000)
        ON CONFLICT DO NOTHING;
        
        -- Get renovation phase ID and create some tasks
        SELECT id INTO phase_id FROM project_phases WHERE project_id = residential_project_id AND name = 'Renovation' LIMIT 1;
        
        IF phase_id IS NOT NULL THEN
            INSERT INTO tasks (
                organization_id, project_id, phase_id, title, description, status, priority, assigned_to
            ) VALUES 
            ('00000000-0000-0000-0000-000000000000', residential_project_id, phase_id, 'Electrical Work', 'Update electrical systems', 'in-progress', 'high', 'fad8b1dd-a2d8-4699-8230-349bd110cd18'),
            ('00000000-0000-0000-0000-000000000000', residential_project_id, phase_id, 'Plumbing Updates', 'Renovate plumbing systems', 'pending', 'medium', 'fad8b1dd-a2d8-4699-8230-349bd110cd18')
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;