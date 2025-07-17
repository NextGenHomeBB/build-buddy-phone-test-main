-- Fix the handle_new_user function to properly create profiles
-- The issue is likely with the function definition or RLS context

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
  user_display_name text;
  new_profile_id uuid;
BEGIN
  -- Extract name from metadata
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name', 
    split_part(NEW.email, '@', 1)
  );
  
  -- Generate a new profile ID
  new_profile_id := gen_random_uuid();
  
  -- Insert into profiles table with explicit values
  INSERT INTO public.profiles (
    id, 
    user_id, 
    auth_user_id, 
    name, 
    role, 
    is_placeholder,
    created_at,
    updated_at
  ) VALUES (
    new_profile_id,
    NEW.id,
    NEW.id,
    user_display_name,
    'worker'::user_role,
    false,
    now(),
    now()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    INSERT INTO public.function_errors (fn, detail)
    VALUES ('handle_new_user', jsonb_build_object(
      'error', SQLERRM,
      'user_id', NEW.id,
      'email', NEW.email
    ));
    RETURN NEW;
END;
$$;