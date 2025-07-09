-- Comprehensive fix for infinite recursion: Replace ALL function calls in RLS policies with direct queries

-- Fix user_project_role policies (critical - these reference projects table)
DROP POLICY IF EXISTS "Managers can manage user roles for their projects" ON public.user_project_role;

CREATE POLICY "Managers can manage user roles for their projects" 
ON public.user_project_role 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Admin check with direct query
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
    OR 
    -- Manager check with direct query (avoid projects table reference)
    (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'manager'
      )
      AND EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = user_project_role.project_id 
        AND manager_id = auth.uid()
      )
    )
  )
);

-- Fix user_phase_role policies (these also reference projects indirectly)
DROP POLICY IF EXISTS "Managers can manage user phase roles for their projects" ON public.user_phase_role;

CREATE POLICY "Managers can manage user phase roles for their projects" 
ON public.user_phase_role 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Admin check with direct query
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
    OR 
    -- Manager check with direct query
    (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'manager'
      )
      AND EXISTS (
        SELECT 1 FROM public.project_phases pp
        JOIN public.projects p ON p.id = pp.project_id
        WHERE pp.id = user_phase_role.phase_id 
        AND p.manager_id = auth.uid()
      )
    )
  )
);

-- Fix tasks policies
DROP POLICY IF EXISTS "Admins and managers can view all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin and managers can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins and managers can update all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admin and managers can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Workers can view their assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Workers can update their assigned tasks" ON public.tasks;

CREATE POLICY "Admins and managers can manage all tasks" 
ON public.tasks 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Workers can access their assigned tasks" 
ON public.tasks 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'worker'
  )
  AND assigned_to = auth.uid()
);

CREATE POLICY "Workers can update their assigned tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'worker'
  )
  AND assigned_to = auth.uid()
);