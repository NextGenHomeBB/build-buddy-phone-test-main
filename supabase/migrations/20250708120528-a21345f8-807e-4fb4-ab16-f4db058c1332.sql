-- Update RLS policies to restrict worker access

-- 1. Projects: Only admin and managers can create projects
DROP POLICY IF EXISTS "Admin, managers, and workers can create projects" ON public.projects;
CREATE POLICY "Only admin and managers can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- 2. Projects: Workers can only view projects where they are assigned tasks
DROP POLICY IF EXISTS "All authenticated users can view projects" ON public.projects;
CREATE POLICY "Admins and managers can view all projects" 
ON public.projects 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Workers can view projects with assigned tasks" 
ON public.projects 
FOR SELECT 
USING (
  get_current_user_role() = 'worker'::user_role 
  AND EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.project_id = projects.id 
    AND tasks.assigned_to = auth.uid()
  )
);

-- 3. Tasks: Workers can only view and update their assigned tasks
DROP POLICY IF EXISTS "Users can view tasks" ON public.tasks;
CREATE POLICY "Admins and managers can view all tasks" 
ON public.tasks 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Workers can view their assigned tasks" 
ON public.tasks 
FOR SELECT 
USING (
  get_current_user_role() = 'worker'::user_role 
  AND assigned_to = auth.uid()
);

-- Update task update policy to be more specific
DROP POLICY IF EXISTS "Admin, managers, and assigned users can update tasks" ON public.tasks;
CREATE POLICY "Admins and managers can update all tasks" 
ON public.tasks 
FOR UPDATE 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Workers can update their assigned tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  get_current_user_role() = 'worker'::user_role 
  AND assigned_to = auth.uid()
);

-- 4. Materials: Workers can only view materials for projects they're assigned to
DROP POLICY IF EXISTS "All authenticated users can view materials" ON public.materials;
CREATE POLICY "Admins and managers can view all materials" 
ON public.materials 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Workers can view materials for assigned projects" 
ON public.materials 
FOR SELECT 
USING (
  get_current_user_role() = 'worker'::user_role 
  AND EXISTS (
    SELECT 1 FROM public.project_materials pm
    JOIN public.tasks t ON t.project_id = pm.project_id
    WHERE pm.material_id = materials.id 
    AND t.assigned_to = auth.uid()
  )
);

-- 5. Project Materials: Similar restrictions
DROP POLICY IF EXISTS "All authenticated users can view project materials" ON public.project_materials;
CREATE POLICY "Admins and managers can view all project materials" 
ON public.project_materials 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Workers can view project materials for assigned projects" 
ON public.project_materials 
FOR SELECT 
USING (
  get_current_user_role() = 'worker'::user_role 
  AND EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.project_id = project_materials.project_id 
    AND tasks.assigned_to = auth.uid()
  )
);

-- 6. Project Phases: Workers can only view phases for projects they're assigned to
DROP POLICY IF EXISTS "All authenticated users can view project phases" ON public.project_phases;
CREATE POLICY "Admins and managers can view all project phases" 
ON public.project_phases 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Workers can view phases for assigned projects" 
ON public.project_phases 
FOR SELECT 
USING (
  get_current_user_role() = 'worker'::user_role 
  AND EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.project_id = project_phases.project_id 
    AND tasks.assigned_to = auth.uid()
  )
);

-- 7. Checklists: Workers can only view checklists for projects they're assigned to
DROP POLICY IF EXISTS "All authenticated users can view checklists" ON public.checklists;
CREATE POLICY "Admins and managers can view all checklists" 
ON public.checklists 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Workers can view checklists for assigned projects" 
ON public.checklists 
FOR SELECT 
USING (
  get_current_user_role() = 'worker'::user_role 
  AND EXISTS (
    SELECT 1 FROM public.project_checklists pc
    JOIN public.tasks t ON t.project_id = pc.project_id
    WHERE pc.checklist_id = checklists.id 
    AND t.assigned_to = auth.uid()
  )
);

-- 8. Project Checklists: Similar restrictions
DROP POLICY IF EXISTS "All authenticated users can view project checklists" ON public.project_checklists;
CREATE POLICY "Admins and managers can view all project checklists" 
ON public.project_checklists 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

CREATE POLICY "Workers can view project checklists for assigned projects" 
ON public.project_checklists 
FOR SELECT 
USING (
  get_current_user_role() = 'worker'::user_role 
  AND EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.project_id = project_checklists.project_id 
    AND tasks.assigned_to = auth.uid()
  )
);