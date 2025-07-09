-- Fix infinite recursion in projects policies by removing security definer function calls
-- Drop existing problematic policies that use get_user_global_role()
DROP POLICY IF EXISTS "Admin and managers can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins and managers can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Only admin and managers can create projects" ON public.projects;
DROP POLICY IF EXISTS "Only admin can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Workers can view projects with assigned tasks" ON public.projects;

-- Create new policies using direct queries to avoid recursion
-- Admin and managers can create projects
CREATE POLICY "Admin and managers can create projects"
ON public.projects
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Admin and managers can view all projects
CREATE POLICY "Admin and managers can view all projects"
ON public.projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Admin and managers can update projects
CREATE POLICY "Admin and managers can update projects"
ON public.projects
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Only admin can delete projects
CREATE POLICY "Only admin can delete projects"
ON public.projects
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Workers can view projects with assigned tasks (keep existing logic)
CREATE POLICY "Workers can view projects with assigned tasks"
ON public.projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'worker'
  )
  AND EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE project_id = projects.id 
    AND assigned_to = auth.uid()
  )
);