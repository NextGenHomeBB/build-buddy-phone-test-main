-- Drop the incorrect trigger and functions
DROP TRIGGER IF EXISTS sync_project_phases_on_default_update ON default_phases;
DROP FUNCTION IF EXISTS trigger_sync_project_phases();
DROP FUNCTION IF EXISTS sync_project_phases_with_default(UUID);

-- Create a corrected function to sync project phase tasks with updated default phases
CREATE OR REPLACE FUNCTION sync_project_phase_tasks_with_default(default_phase_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_phase_rec RECORD;
  phase_rec RECORD;
  checklist_item TEXT;
  new_task_id UUID;
BEGIN
  -- Get the updated default phase
  SELECT * INTO default_phase_rec FROM default_phases WHERE id = default_phase_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Find all project phases with the same name
  FOR phase_rec IN 
    SELECT id, project_id, name 
    FROM project_phases 
    WHERE name = default_phase_rec.name
  LOOP
    -- Delete existing tasks for this phase that were created from default checklist
    -- (We'll identify them by having no assigned_to and being from 'auto_import' or NULL source)
    DELETE FROM tasks 
    WHERE phase_id = phase_rec.id 
    AND assigned_to IS NULL 
    AND (description LIKE default_phase_rec.name || ' - %' OR title IN (
      SELECT jsonb_array_elements_text(default_phase_rec.checklist)
    ));
    
    -- Create new tasks from the updated default phase checklist
    FOR checklist_item IN 
      SELECT jsonb_array_elements_text(default_phase_rec.checklist)
    LOOP
      new_task_id := gen_random_uuid();
      
      INSERT INTO tasks (
        id,
        title,
        description,
        project_id,
        phase_id,
        priority,
        status,
        created_at,
        updated_at
      ) VALUES (
        new_task_id,
        checklist_item,
        default_phase_rec.name || ' - ' || checklist_item,
        phase_rec.project_id,
        phase_rec.id,
        'medium',
        'todo',
        now(),
        now()
      );
    END LOOP;
  END LOOP;
END;
$$;

-- Create a trigger to automatically sync project phase tasks when default phases are updated
CREATE OR REPLACE FUNCTION trigger_sync_project_phase_tasks()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only sync if the checklist was actually changed
  IF OLD.checklist IS DISTINCT FROM NEW.checklist THEN
    PERFORM sync_project_phase_tasks_with_default(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on default_phases table
CREATE TRIGGER sync_project_phase_tasks_on_default_update
  AFTER UPDATE ON default_phases
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_project_phase_tasks();