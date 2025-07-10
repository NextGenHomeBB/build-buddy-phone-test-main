-- Fix the project progress calculation to be based on task completion, not just completed phases
CREATE OR REPLACE FUNCTION public.update_project_progress(project_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_tasks integer;
  completed_tasks integer;
  new_progress integer;
BEGIN
  -- Count total tasks for this project
  SELECT COUNT(*) INTO total_tasks
  FROM tasks
  WHERE project_id = project_id_param;
  
  -- Count completed tasks for this project
  SELECT COUNT(*) INTO completed_tasks
  FROM tasks
  WHERE project_id = project_id_param AND status = 'completed';
  
  -- Calculate progress percentage (0 if no tasks)
  IF total_tasks > 0 THEN
    new_progress := ROUND((completed_tasks::decimal / total_tasks::decimal) * 100);
  ELSE
    new_progress := 0;
  END IF;
  
  -- Update the project progress
  UPDATE projects
  SET progress = new_progress, updated_at = now()
  WHERE id = project_id_param;
END;
$$;

-- Now manually update the current project to fix its progress
SELECT update_project_progress('26b10ca2-a1b7-4445-9095-4bee6b9b5674');