-- Update the first user in the system to be an admin (you can change this email to match your account)
-- This assumes you already have a user account - replace 'your-email@example.com' with your actual email
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = (SELECT email FROM auth.users ORDER BY created_at LIMIT 1);

-- Also update the profiles table for the same user
UPDATE public.profiles 
SET role = 'admin'::user_role 
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);

-- Create a function to create new users (this will be called from the admin interface)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_email text,
  user_name text,
  user_role user_role DEFAULT 'worker'::user_role
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if current user is admin
  IF get_current_user_role() != 'admin'::user_role THEN
    RAISE EXCEPTION 'Only admins can create users';
  END IF;
  
  -- Generate a new user ID
  new_user_id := gen_random_uuid();
  
  -- Insert into profiles table (the user will need to sign up separately)
  INSERT INTO public.profiles (id, user_id, name, role)
  VALUES (gen_random_uuid(), new_user_id, user_name, user_role);
  
  RETURN new_user_id;
END;
$$;

-- Create a function to update user roles
CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id uuid,
  new_role user_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF get_current_user_role() != 'admin'::user_role THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- Update the user's role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN FOUND;
END;
$$;

-- Create RLS policies for admin user management
CREATE POLICY "Admins can view all user profiles" 
ON public.profiles 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Admins can update user roles" 
ON public.profiles 
FOR UPDATE 
USING (get_current_user_role() = 'admin'::user_role);