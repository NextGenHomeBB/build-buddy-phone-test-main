-- Fix infinite recursion in projects policies
-- Drop existing problematic policies that use get_current_user_role()
DROP POLICY IF EXISTS "Admin and managers can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins and managers can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Only admin and managers can create projects" ON public.projects;
DROP POLICY IF EXISTS "Only admin can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Workers can view projects with assigned tasks" ON public.projects;

-- Create new policies using the security definer function
CREATE POLICY "Admin and managers can update projects" 
ON public.projects 
FOR UPDATE 
USING (
  get_user_global_role(auth.uid()) = 'admin' OR
  get_user_global_role(auth.uid()) = 'manager'
);

CREATE POLICY "Admins and managers can view all projects" 
ON public.projects 
FOR SELECT 
USING (
  get_user_global_role(auth.uid()) = 'admin' OR
  get_user_global_role(auth.uid()) = 'manager'
);

CREATE POLICY "Only admin and managers can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (
  get_user_global_role(auth.uid()) = 'admin' OR
  get_user_global_role(auth.uid()) = 'manager'
);

CREATE POLICY "Only admin can delete projects" 
ON public.projects 
FOR DELETE 
USING (
  get_user_global_role(auth.uid()) = 'admin'
);

CREATE POLICY "Workers can view projects with assigned tasks" 
ON public.projects 
FOR SELECT 
USING (
  get_user_global_role(auth.uid()) = 'worker' AND 
  EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.project_id = projects.id AND tasks.assigned_to = auth.uid()
  )
);

-- Keep the existing project_read_worker_task policy as it doesn't use get_current_user_role()
-- This policy allows workers to see projects they have explicit roles for or tasks assigned