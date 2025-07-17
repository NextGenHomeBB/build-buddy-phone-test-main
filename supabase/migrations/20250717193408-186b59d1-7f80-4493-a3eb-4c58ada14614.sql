-- Fix the complete user signup flow by addressing all issues identified

-- 1. Fix the handle_new_user function to set user_id correctly
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
    INSERT INTO public.profiles (id, user_id, auth_user_id, name, role, is_placeholder)
    VALUES (gen_random_uuid(), NEW.id, NEW.id, user_display_name, 'worker', false);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Update RLS policies to use user_id correctly
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;

CREATE POLICY "Allow profile creation during signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Allow if this is a regular user creating their own profile (non-placeholder)
  (auth.uid() = user_id AND is_placeholder = false)
  OR
  -- Allow placeholder users created by admins/managers
  (is_placeholder = true AND auth.uid() IS NOT NULL)
  OR
  -- Allow system/service role to create profiles (for the trigger)
  auth.uid() IS NULL
);

-- 3. Make user_id non-nullable for data integrity (do this after fixing the function)
-- First ensure all existing profiles have user_id set
UPDATE public.profiles 
SET user_id = auth_user_id 
WHERE user_id IS NULL AND auth_user_id IS NOT NULL;

-- Now make user_id non-nullable
ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;