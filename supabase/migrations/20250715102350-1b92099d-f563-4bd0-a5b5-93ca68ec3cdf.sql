-- Step 1: Update RLS policy for tasks to include task_workers assignments
DROP POLICY IF EXISTS "Workers can access their assigned tasks" ON public.tasks;

-- Create new policy that checks both assigned_to and task_workers table
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

-- Step 2: Update task update policy for workers to include task_workers assignments
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

-- Step 3: Create function to sync task_workers to assigned_to field
CREATE OR REPLACE FUNCTION sync_task_workers_to_assigned_to()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update tasks that have task_workers but no assigned_to
  UPDATE tasks 
  SET assigned_to = (
    SELECT user_id 
    FROM task_workers 
    WHERE task_workers.task_id = tasks.id 
    AND task_workers.is_primary = true 
    LIMIT 1
  )
  WHERE assigned_to IS NULL 
  AND EXISTS (
    SELECT 1 FROM task_workers 
    WHERE task_workers.task_id = tasks.id
  );
  
  -- If no primary worker, use the first worker
  UPDATE tasks 
  SET assigned_to = (
    SELECT user_id 
    FROM task_workers 
    WHERE task_workers.task_id = tasks.id 
    ORDER BY created_at ASC
    LIMIT 1
  )
  WHERE assigned_to IS NULL 
  AND EXISTS (
    SELECT 1 FROM task_workers 
    WHERE task_workers.task_id = tasks.id
  );
END;
$$;

-- Step 4: Execute the sync function to fix existing data
SELECT sync_task_workers_to_assigned_to();