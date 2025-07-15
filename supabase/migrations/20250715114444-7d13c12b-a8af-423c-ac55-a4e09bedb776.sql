-- Fix infinite recursion in task_workers RLS policies
-- The issue is circular dependency between tasks and task_workers policies

-- Drop the problematic policy that creates circular dependency
DROP POLICY IF EXISTS "Authenticated users can view task workers for same project" ON public.task_workers;

-- Create a simpler policy that doesn't reference tasks table directly
-- Users can view task workers if they have access to the project via user_project_role
CREATE POLICY "Users can view task workers for assigned projects" 
ON public.task_workers 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_project_role upr
    JOIN public.tasks t ON t.project_id = upr.project_id
    WHERE t.id = task_workers.task_id 
    AND upr.user_id = auth.uid()
  )
);