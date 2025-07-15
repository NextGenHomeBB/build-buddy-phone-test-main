-- First, add unique constraint to user_project_role table
ALTER TABLE public.user_project_role 
ADD CONSTRAINT user_project_role_unique 
UNIQUE (user_id, project_id, role);

-- Update RLS policy for tasks to include task_workers assignments
DROP POLICY IF EXISTS "Workers can access their assigned tasks" ON public.tasks;

CREATE POLICY "Workers can access their assigned tasks" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'worker'::user_role
  )) AND 
  (
    assigned_to = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM task_workers 
      WHERE task_workers.task_id = tasks.id AND task_workers.user_id = auth.uid()
    )
  )
);

-- Update task update policy for workers to include task_workers assignments
DROP POLICY IF EXISTS "Workers can update their assigned tasks" ON public.tasks;

CREATE POLICY "Workers can update their assigned tasks" 
ON public.tasks 
FOR UPDATE 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'worker'::user_role
  )) AND 
  (
    assigned_to = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM task_workers 
      WHERE task_workers.task_id = tasks.id AND task_workers.user_id = auth.uid()
    )
  )
);