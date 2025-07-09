-- Fix infinite recursion in projects table policies
-- Drop all existing conflicting policies on projects table
DROP POLICY IF EXISTS "project_read_worker_task" ON public.projects;
DROP POLICY IF EXISTS "Admin and managers can create projects" ON public.projects;
DROP POLICY IF EXISTS "Admin and managers can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Admin and managers can update projects" ON public.projects;
DROP POLICY IF EXISTS "Only admin can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Workers can view projects with assigned tasks" ON public.projects;
DROP POLICY IF EXISTS "allow_admin_or_manager_insert" ON public.projects;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON public.projects;

-- Create clean, non-conflicting policies using get_current_user_role() function

-- Allow admin and managers to do everything
CREATE POLICY "admin_manager_full_access" 
ON public.projects 
FOR ALL 
TO authenticated
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role]));

-- Allow workers to view projects they have tasks in or are assigned to via user_project_role
CREATE POLICY "worker_project_access" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (
  get_current_user_role() = 'worker'::user_role 
  AND (
    EXISTS (
      SELECT 1 FROM public.tasks 
      WHERE tasks.project_id = projects.id 
      AND tasks.assigned_to = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_project_role 
      WHERE user_project_role.project_id = projects.id 
      AND user_project_role.user_id = auth.uid()
    )
  )
);