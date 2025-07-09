-- Fix infinite recursion by removing circular dependencies between projects and tasks RLS policies
-- Drop all existing policies that cause circular dependency
DROP POLICY IF EXISTS "admin_manager_full_access" ON public.projects;
DROP POLICY IF EXISTS "worker_project_access" ON public.projects;

-- Create clean, non-circular policies for projects table
-- Admin and managers get full access (simple role check, no joins)
CREATE POLICY "admin_manager_projects_access" 
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

-- Workers can only view projects they're explicitly assigned to via user_project_role
-- This removes the circular dependency with tasks table
CREATE POLICY "worker_projects_access" 
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

-- Ensure the auto-assignment trigger is working properly
-- This trigger assigns workers to projects when they get tasks
DROP TRIGGER IF EXISTS auto_assign_user_to_project_trigger ON public.tasks;

CREATE TRIGGER auto_assign_user_to_project_trigger
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_user_to_project();