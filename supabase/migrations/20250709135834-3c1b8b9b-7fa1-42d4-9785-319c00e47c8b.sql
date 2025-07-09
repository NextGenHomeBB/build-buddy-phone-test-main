-- Function to auto-assign user to project when assigned a task
CREATE OR REPLACE FUNCTION public.auto_assign_user_to_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if assigned_to is not null
  IF NEW.assigned_to IS NOT NULL THEN
    -- Upsert user_project_role to ensure user has worker access to the project
    INSERT INTO public.user_project_role (user_id, project_id, role)
    VALUES (NEW.assigned_to, NEW.project_id, 'worker')
    ON CONFLICT (user_id, project_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
CREATE TRIGGER auto_assign_user_to_project_on_insert
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_user_to_project();

-- Create trigger for UPDATE operations
CREATE TRIGGER auto_assign_user_to_project_on_update
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  WHEN (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to)
  EXECUTE FUNCTION public.auto_assign_user_to_project();