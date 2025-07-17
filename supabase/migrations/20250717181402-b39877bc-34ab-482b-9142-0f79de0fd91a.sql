-- Create a function to sync project phases with updated default phases
CREATE OR REPLACE FUNCTION sync_project_phases_with_default(default_phase_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update all project phases with the same name as the default phase
  UPDATE project_phases 
  SET 
    checklist = (
      SELECT checklist 
      FROM default_phases 
      WHERE id = default_phase_id
    ),
    updated_at = now()
  WHERE EXISTS (
    SELECT 1 
    FROM default_phases 
    WHERE default_phases.id = default_phase_id 
    AND project_phases.name = default_phases.name
  );
END;
$$;

-- Create a trigger to automatically sync project phases when default phases are updated
CREATE OR REPLACE FUNCTION trigger_sync_project_phases()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only sync if the checklist was actually changed
  IF OLD.checklist IS DISTINCT FROM NEW.checklist THEN
    PERFORM sync_project_phases_with_default(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on default_phases table
DROP TRIGGER IF EXISTS sync_project_phases_on_default_update ON default_phases;
CREATE TRIGGER sync_project_phases_on_default_update
  AFTER UPDATE ON default_phases
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_project_phases();