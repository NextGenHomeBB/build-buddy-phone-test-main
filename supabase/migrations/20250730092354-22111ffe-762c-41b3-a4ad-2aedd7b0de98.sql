-- Add missing columns to existing tables
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'residential';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

ALTER TABLE project_phases ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- Create missing tables that the codebase expects
CREATE TABLE IF NOT EXISTS project_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    completed_items JSONB DEFAULT '{}',
    organization_id UUID NOT NULL DEFAULT current_org(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(project_id, checklist_id)
);

CREATE TABLE IF NOT EXISTS project_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    catalog_id UUID REFERENCES material_catalog(id),
    name TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit_price NUMERIC DEFAULT 0,
    total_cost NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
    organization_id UUID NOT NULL DEFAULT current_org(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_phase_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_id UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'worker',
    organization_id UUID NOT NULL DEFAULT current_org(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, project_id, phase_id)
);

-- Enable RLS on new tables
ALTER TABLE project_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_phase_role ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_checklists
CREATE POLICY "ProjectChecklists: org members read" ON project_checklists
    FOR SELECT USING (organization_id = current_org());

CREATE POLICY "ProjectChecklists: admin manage" ON project_checklists
    FOR ALL USING (organization_id = current_org() AND (auth.jwt() ->> 'role') = 'admin');

-- Create RLS policies for project_materials
CREATE POLICY "ProjectMaterials: org members read" ON project_materials
    FOR SELECT USING (organization_id = current_org());

CREATE POLICY "ProjectMaterials: admin manage" ON project_materials
    FOR ALL USING (organization_id = current_org() AND (auth.jwt() ->> 'role') = 'admin');

-- Create RLS policies for user_phase_role
CREATE POLICY "UserPhaseRole: org members read" ON user_phase_role
    FOR SELECT USING (organization_id = current_org());

CREATE POLICY "UserPhaseRole: admin manage" ON user_phase_role
    FOR ALL USING (organization_id = current_org() AND (auth.jwt() ->> 'role') = 'admin');

-- Add triggers for updated_at
CREATE TRIGGER update_project_checklists_updated_at
    BEFORE UPDATE ON project_checklists
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_project_materials_updated_at
    BEFORE UPDATE ON project_materials
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_user_phase_role_updated_at
    BEFORE UPDATE ON user_phase_role
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();