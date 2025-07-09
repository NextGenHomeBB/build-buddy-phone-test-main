-- Fix infinite recursion by using direct queries instead of get_current_user_role() function
-- Drop the problematic policies
DROP POLICY IF EXISTS "admin_manager_projects_access" ON public.projects;
DROP POLICY IF EXISTS "worker_projects_access" ON public.projects;

-- Create simple, direct policies without function calls
-- Admin and managers can do everything on projects
CREATE POLICY "Admins and managers can manage all projects"
ON public.projects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Workers can only view projects they're assigned to via user_project_role
CREATE POLICY "Workers can view assigned projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
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