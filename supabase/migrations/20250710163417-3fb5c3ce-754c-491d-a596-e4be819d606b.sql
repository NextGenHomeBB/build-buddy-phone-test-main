-- Function to calculate and update project progress based on completed phases
CREATE OR REPLACE FUNCTION public.update_project_progress(project_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_phases integer;
  completed_phases integer;
  new_progress integer;
BEGIN
  -- Count total phases for this project
  SELECT COUNT(*) INTO total_phases
  FROM project_phases
  WHERE project_id = project_id_param;
  
  -- Count completed phases for this project
  SELECT COUNT(*) INTO completed_phases
  FROM project_phases
  WHERE project_id = project_id_param AND status = 'completed';
  
  -- Calculate progress percentage (0 if no phases)
  IF total_phases > 0 THEN
    new_progress := ROUND((completed_phases::decimal / total_phases::decimal) * 100);
  ELSE
    new_progress := 0;
  END IF;
  
  -- Update the project progress
  UPDATE projects
  SET progress = new_progress, updated_at = now()
  WHERE id = project_id_param;
END;
$$;

-- Update the existing phase progress function to also update project progress
CREATE OR REPLACE FUNCTION public.update_phase_progress(phase_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_tasks integer;
  completed_tasks integer;
  new_progress integer;
  project_id_var uuid;
BEGIN
  -- Get the project_id for this phase
  SELECT project_id INTO project_id_var
  FROM project_phases
  WHERE id = phase_id_param;
  
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
  
  -- Also update the project progress if we have a project_id
  IF project_id_var IS NOT NULL THEN
    PERFORM update_project_progress(project_id_var);
  END IF;
END;
$$;

-- Create trigger to automatically update project progress when phase status changes
CREATE OR REPLACE FUNCTION public.trigger_update_project_progress()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update project progress when phase status or progress changes
  PERFORM update_project_progress(NEW.project_id);
  RETURN NEW;
END;
$$;

-- Create the trigger on project_phases table
DROP TRIGGER IF EXISTS update_project_progress_trigger ON project_phases;
CREATE TRIGGER update_project_progress_trigger
  AFTER UPDATE OF status, progress ON project_phases
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_project_progress();