-- COMPREHENSIVE FIX: Replace ALL get_current_user_role() function calls to eliminate infinite recursion

-- Fix checklists policies
DROP POLICY IF EXISTS "Admin and managers can manage checklists" ON public.checklists;
DROP POLICY IF EXISTS "Admins and managers can view all checklists" ON public.checklists;
DROP POLICY IF EXISTS "Workers can view checklists for assigned projects" ON public.checklists;

CREATE POLICY "Admin and managers can manage checklists" 
ON public.checklists 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Workers can view checklists for assigned projects" 
ON public.checklists 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'worker'
  )
  AND EXISTS (
    SELECT 1 FROM project_checklists pc
    JOIN tasks t ON t.project_id = pc.project_id
    WHERE pc.checklist_id = checklists.id 
    AND t.assigned_to = auth.uid()
  )
);

-- Fix materials policies
DROP POLICY IF EXISTS "Admin and managers can manage materials" ON public.materials;
DROP POLICY IF EXISTS "Admins and managers can view all materials" ON public.materials;
DROP POLICY IF EXISTS "Workers can view materials for assigned projects" ON public.materials;

CREATE POLICY "Admin and managers can manage materials" 
ON public.materials 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Workers can view materials for assigned projects" 
ON public.materials 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'worker'
  )
  AND EXISTS (
    SELECT 1 FROM project_materials pm
    JOIN tasks t ON t.project_id = pm.project_id
    WHERE pm.material_id = materials.id 
    AND t.assigned_to = auth.uid()
  )
);

-- Fix project_checklists policies
DROP POLICY IF EXISTS "Admin and managers can manage project checklists" ON public.project_checklists;
DROP POLICY IF EXISTS "Admins and managers can view all project checklists" ON public.project_checklists;
DROP POLICY IF EXISTS "Workers can view project checklists for assigned projects" ON public.project_checklists;

CREATE POLICY "Admin and managers can manage project checklists" 
ON public.project_checklists 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Workers can view project checklists for assigned projects" 
ON public.project_checklists 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'worker'
  )
  AND EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.project_id = project_checklists.project_id 
    AND tasks.assigned_to = auth.uid()
  )
);

-- Fix project_materials policies
DROP POLICY IF EXISTS "Admin and managers can manage project materials" ON public.project_materials;
DROP POLICY IF EXISTS "Admins and managers can view all project materials" ON public.project_materials;
DROP POLICY IF EXISTS "Workers can view project materials for assigned projects" ON public.project_materials;

CREATE POLICY "Admin and managers can manage project materials" 
ON public.project_materials 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Workers can view project materials for assigned projects" 
ON public.project_materials 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'worker'
  )
  AND EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.project_id = project_materials.project_id 
    AND tasks.assigned_to = auth.uid()
  )
);

-- Fix project_phases policies
DROP POLICY IF EXISTS "Admin and managers can manage project phases" ON public.project_phases;
DROP POLICY IF EXISTS "Admins and managers can view all project phases" ON public.project_phases;
DROP POLICY IF EXISTS "Workers can view phases for assigned projects" ON public.project_phases;

CREATE POLICY "Admin and managers can manage project phases" 
ON public.project_phases 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Workers can view phases for assigned projects" 
ON public.project_phases 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'worker'
  )
  AND EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.project_id = project_phases.project_id 
    AND tasks.assigned_to = auth.uid()
  )
);

-- Fix time_sheets policies
DROP POLICY IF EXISTS "Admin and managers can view all time sheets" ON public.time_sheets;

CREATE POLICY "Admin and managers can view all time sheets" 
ON public.time_sheets 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);