-- Fix infinite recursion by simplifying worker policies for tasks
-- Remove task_workers references to break circular dependency

-- Drop and recreate worker policies without task_workers references
DROP POLICY IF EXISTS "Workers can access their assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Workers can update their assigned tasks" ON public.tasks;

-- Simplified worker policies that only check direct assignment
CREATE POLICY "Workers can access their assigned tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  get_user_global_role(auth.uid()) = 'worker' AND 
  assigned_to = auth.uid()
);

CREATE POLICY "Workers can update their assigned tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  get_user_global_role(auth.uid()) = 'worker' AND 
  assigned_to = auth.uid()
);