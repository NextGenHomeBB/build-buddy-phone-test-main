-- Create function to sync task_workers to assigned_to field
CREATE OR REPLACE FUNCTION sync_task_workers_to_assigned_to()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update tasks that have task_workers but no assigned_to
  -- Set assigned_to to the primary worker first
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
    AND task_workers.is_primary = true
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

-- Execute the sync function to fix existing data
SELECT sync_task_workers_to_assigned_to();