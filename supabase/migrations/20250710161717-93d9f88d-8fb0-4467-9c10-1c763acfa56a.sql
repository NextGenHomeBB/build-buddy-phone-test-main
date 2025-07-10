-- Function to calculate and update phase progress based on completed tasks
CREATE OR REPLACE FUNCTION public.update_phase_progress(phase_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_tasks integer;
  completed_tasks integer;
  new_progress integer;
BEGIN
  -- Count total tasks for this phase
  SELECT COUNT(*) INTO total_tasks
  FROM tasks
  WHERE phase_id = phase_id_param;
  
  -- Count completed tasks for this phase
  SELECT COUNT(*) INTO completed_tasks
  FROM tasks
  WHERE phase_id = phase_id_param AND status = 'completed';
  
  -- Calculate progress percentage (0 if no tasks)
  IF total_tasks > 0 THEN
    new_progress := ROUND((completed_tasks::decimal / total_tasks::decimal) * 100);
  ELSE
    new_progress := 0;
  END IF;
  
  -- Update the phase progress
  UPDATE project_phases
  SET progress = new_progress, updated_at = now()
  WHERE id = phase_id_param;
END;
$$;