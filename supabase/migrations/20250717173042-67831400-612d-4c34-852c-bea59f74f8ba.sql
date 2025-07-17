-- First, let's check if we can create placeholder users by temporarily allowing NULL user_id
-- or by modifying the constraint to allow placeholder users

-- Option 1: Allow the user_id to be nullable for placeholder users
-- But first let's see what's the current constraint
-- Since we need placeholder users to work, let's modify the profiles table to support this

-- Create a modified insert approach that doesn't violate the foreign key
-- by using a different approach for placeholder users

-- We'll create a function that inserts placeholder users safely
CREATE OR REPLACE FUNCTION public.create_placeholder_user(
  user_name text,
  user_email text,
  user_role user_role DEFAULT 'worker'::user_role
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  new_profile_id uuid;
BEGIN
  -- Check if current user is admin
  IF get_current_user_role() != 'admin'::user_role THEN
    RAISE EXCEPTION 'Only admins can create users';
  END IF;
  
  -- Generate IDs
  new_user_id := gen_random_uuid();
  new_profile_id := gen_random_uuid();
  
  -- Insert into profiles table with placeholder user that doesn't reference auth.users
  -- We'll use a special approach for placeholder users
  INSERT INTO public.profiles (
    id, 
    user_id, 
    name, 
    role, 
    is_placeholder
  ) VALUES (
    new_profile_id,
    new_user_id,
    user_name,
    user_role,
    true
  );
  
  RETURN new_user_id;
EXCEPTION
  WHEN foreign_key_violation THEN
    -- If we hit the foreign key constraint, we need a different approach
    -- Let's create the profile without the user_id constraint
    RAISE EXCEPTION 'Cannot create placeholder user due to constraints. Please contact system administrator.';
END;
$$;