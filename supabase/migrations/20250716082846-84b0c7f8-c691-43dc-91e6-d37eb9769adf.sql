-- Migration: Link placeholder profiles to auth users for "My Tasks" to work

-- 1. Back-fill existing placeholder profiles to ensure proper linking
UPDATE profiles 
SET is_placeholder = true 
WHERE auth_user_id IS NULL 
  AND user_id NOT IN (
    SELECT id FROM auth.users
  );

-- 2. Create function to link placeholder profile to auth user
CREATE OR REPLACE FUNCTION public.link_placeholder_to_auth_user(
  placeholder_name text,
  auth_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  placeholder_user_id uuid;
BEGIN
  -- Find the placeholder profile by name
  SELECT user_id INTO placeholder_user_id
  FROM profiles
  WHERE lower(trim(name)) = lower(trim(placeholder_name))
    AND is_placeholder = true
    AND auth_user_id IS NULL
  LIMIT 1;
  
  IF placeholder_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Link the placeholder to the auth user
  UPDATE profiles
  SET auth_user_id = link_placeholder_to_auth_user.auth_user_id,
      is_placeholder = false,
      updated_at = now()
  WHERE user_id = placeholder_user_id;
  
  RETURN true;
END;
$$;

-- 3. Enhanced handle_new_user function to attempt linking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
DECLARE
  user_display_name text;
  placeholder_linked boolean;
BEGIN
  -- Extract name from metadata
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name', 
    split_part(NEW.email, '@', 1)
  );
  
  -- Try to link existing placeholder first
  SELECT public.link_placeholder_to_auth_user(user_display_name, NEW.id) 
  INTO placeholder_linked;
  
  -- If no placeholder was linked, create new profile
  IF NOT placeholder_linked THEN
    INSERT INTO public.profiles (user_id, auth_user_id, name, role, is_placeholder)
    VALUES (NEW.id, NEW.id, user_display_name, 'worker', false);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Create view for tasks that handles both direct assignment and linked profiles
CREATE OR REPLACE VIEW public.user_tasks AS
SELECT DISTINCT t.*,
  p.name as project_name,
  ph.name as phase_name,
  assigned_profile.name as assigned_user_name,
  assigned_by_profile.name as assigned_by_user_name
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN project_phases ph ON t.phase_id = ph.id
LEFT JOIN profiles assigned_profile ON t.assigned_to = assigned_profile.user_id
LEFT JOIN profiles assigned_by_profile ON t.assigned_by = assigned_by_profile.user_id
WHERE 
  -- Direct assignment to auth user
  t.assigned_to = auth.uid()
  OR
  -- Assignment via linked placeholder profile
  t.assigned_to IN (
    SELECT user_id FROM profiles 
    WHERE auth_user_id = auth.uid()
  )
  OR
  -- Assignment via task_workers table with auth user
  t.id IN (
    SELECT tw.task_id FROM task_workers tw
    WHERE tw.user_id = auth.uid()
  )
  OR
  -- Assignment via task_workers table with linked placeholder
  t.id IN (
    SELECT tw.task_id FROM task_workers tw
    JOIN profiles p ON tw.user_id = p.user_id
    WHERE p.auth_user_id = auth.uid()
  );

-- Enable RLS on the view (though it inherits from base tables)
ALTER VIEW public.user_tasks SET (security_invoker = true);