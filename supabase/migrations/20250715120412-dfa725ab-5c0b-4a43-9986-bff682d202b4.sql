-- Phase 1: Fix infinite recursion in tasks and task_workers table policies
-- Drop existing problematic policies that directly query profiles table

-- Tasks table policies
DROP POLICY IF EXISTS "Admins and managers can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Managers can approve tasks" ON public.tasks;
DROP POLICY IF EXISTS "Workers can access their assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Workers can update their assigned tasks" ON public.tasks;

-- Task_workers table policies  
DROP POLICY IF EXISTS "Managers and admins can delete task workers" ON public.task_workers;
DROP POLICY IF EXISTS "Managers and admins can insert task workers" ON public.task_workers;
DROP POLICY IF EXISTS "Only admins can update task workers" ON public.task_workers;

-- Create new policies using the security definer function to avoid recursion

-- Tasks table policies
CREATE POLICY "Admins and managers can manage all tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  get_user_global_role(auth.uid()) = ANY (ARRAY['admin', 'manager'])
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  get_user_global_role(auth.uid()) = ANY (ARRAY['admin', 'manager'])
);

CREATE POLICY "Managers can approve tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  get_user_global_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
);

CREATE POLICY "Workers can access their assigned tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  get_user_global_role(auth.uid()) = 'worker' AND 
  (
    assigned_to = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM task_workers 
      WHERE task_workers.task_id = tasks.id AND task_workers.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Workers can update their assigned tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  get_user_global_role(auth.uid()) = 'worker' AND 
  (
    assigned_to = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM task_workers 
      WHERE task_workers.task_id = tasks.id AND task_workers.user_id = auth.uid()
    )
  )
);

-- Task_workers table policies
CREATE POLICY "Managers and admins can delete task workers"
ON public.task_workers
FOR DELETE
TO authenticated
USING (
  get_user_global_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
);

CREATE POLICY "Managers and admins can insert task workers"
ON public.task_workers
FOR INSERT
TO authenticated
WITH CHECK (
  get_user_global_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
);

CREATE POLICY "Only admins can update task workers"
ON public.task_workers
FOR UPDATE
TO authenticated
USING (
  get_user_global_role(auth.uid()) = 'admin'
);