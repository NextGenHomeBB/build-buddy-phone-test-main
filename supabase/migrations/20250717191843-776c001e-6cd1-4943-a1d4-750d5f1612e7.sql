-- Fix the handle_new_user function to properly create profiles for new users
-- The issue is that user_id should be a generated UUID, not the auth user ID

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_display_name text;
  placeholder_linked boolean;
  new_profile_id uuid;
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
    new_profile_id := gen_random_uuid();
    INSERT INTO public.profiles (id, user_id, auth_user_id, name, role, is_placeholder)
    VALUES (new_profile_id, new_profile_id, NEW.id, user_display_name, 'worker', false);
  END IF;
  
  RETURN NEW;
END;
$$;