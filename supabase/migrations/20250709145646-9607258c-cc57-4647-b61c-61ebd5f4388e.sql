-- Fix infinite recursion by adding explicit NULL checks to RLS policies
-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Admins and managers can manage all projects" ON public.projects;
DROP POLICY IF EXISTS "Workers can view assigned projects" ON public.projects;

-- Create new policies with explicit NULL checks to prevent infinite recursion
-- Admin and managers can do everything on projects (with NULL check)
CREATE POLICY "Admins and managers can manage all projects"
ON public.projects
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Workers can only view projects they're assigned to (with NULL check)
CREATE POLICY "Workers can view assigned projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'worker'
  )
  AND EXISTS (
    SELECT 1 FROM public.user_project_role 
    WHERE user_id = auth.uid() 
    AND project_id = projects.id
  )
);