-- Fix RLS policies to work with the existing profile structure instead of relying on JWT claims
-- Create a security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Update the profiles RLS policy to use the security definer function instead of JWT claims
DROP POLICY IF EXISTS "Profiles: admin manage" ON public.profiles;

CREATE POLICY "Profiles: admin manage" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (
  organization_id = current_org() 
  AND (
    public.get_current_user_role() = 'admin' 
    OR id = auth.uid()
  )
)
WITH CHECK (
  organization_id = current_org() 
  AND (
    public.get_current_user_role() = 'admin' 
    OR id = auth.uid()
  )
);

-- Also update other policies that rely on JWT role claims
DROP POLICY IF EXISTS "Checklists: admin manage" ON public.checklists;
CREATE POLICY "Checklists: admin manage" 
ON public.checklists 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "ChecklistItems: admin manage" ON public.checklist_items;
CREATE POLICY "ChecklistItems: admin manage" 
ON public.checklist_items 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Feedback: admin manage" ON public.feedback;
CREATE POLICY "Feedback: admin manage" 
ON public.feedback 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "LabourEntries: admin manage" ON public.labour_entries;
CREATE POLICY "LabourEntries: admin manage" 
ON public.labour_entries 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "MaterialCatalog: admin crud" ON public.material_catalog;
CREATE POLICY "MaterialCatalog: admin crud" 
ON public.material_catalog 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Materials: admin crud" ON public.materials;
CREATE POLICY "Materials: admin crud" 
ON public.materials 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Organizations: admins only" ON public.organizations;
CREATE POLICY "Organizations: admins only" 
ON public.organizations 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() = 'admin' AND id = current_org());

DROP POLICY IF EXISTS "ProjectChecklists: admin manage" ON public.project_checklists;
CREATE POLICY "ProjectChecklists: admin manage" 
ON public.project_checklists 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "ProjectMaterials: admin manage" ON public.project_materials;
CREATE POLICY "ProjectMaterials: admin manage" 
ON public.project_materials 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "ProjectMembers: admin manage" ON public.project_members;
CREATE POLICY "ProjectMembers: admin manage" 
ON public.project_members 
FOR ALL 
TO authenticated
USING (public.get_current_user_role() = 'admin' AND project_id IN (SELECT id FROM projects WHERE organization_id = current_org()));

DROP POLICY IF EXISTS "ProjectMembers: org members" ON public.project_members;
CREATE POLICY "ProjectMembers: org members" 
ON public.project_members 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid() OR public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "ProjectPhases: admin manage" ON public.project_phases;
CREATE POLICY "ProjectPhases: admin manage" 
ON public.project_phases 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "ProjectSchedules: admin manage" ON public.project_schedules;
CREATE POLICY "ProjectSchedules: admin manage" 
ON public.project_schedules 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Projects: admin crud" ON public.projects;
CREATE POLICY "Projects: admin crud" 
ON public.projects 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "TaskComments: admin manage" ON public.task_comments;
CREATE POLICY "TaskComments: admin manage" 
ON public.task_comments 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "TaskWorkers: admin manage" ON public.task_workers;
CREATE POLICY "TaskWorkers: admin manage" 
ON public.task_workers 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Tasks: admin manage" ON public.tasks;
CREATE POLICY "Tasks: admin manage" 
ON public.tasks 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "TimeEntries: owner or admin" ON public.time_entries;
CREATE POLICY "TimeEntries: owner or admin" 
ON public.time_entries 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid() OR (organization_id = current_org() AND public.get_current_user_role() = 'admin'));

DROP POLICY IF EXISTS "UserPhaseRole: admin manage" ON public.user_phase_role;
CREATE POLICY "UserPhaseRole: admin manage" 
ON public.user_phase_role 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "UserProjectRole: admin manage" ON public.user_project_role;
CREATE POLICY "UserProjectRole: admin manage" 
ON public.user_project_role 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "WorkerCosts: admin manage" ON public.worker_costs;
CREATE POLICY "WorkerCosts: admin manage" 
ON public.worker_costs 
FOR ALL 
TO authenticated
USING (organization_id = current_org() AND public.get_current_user_role() = 'admin');