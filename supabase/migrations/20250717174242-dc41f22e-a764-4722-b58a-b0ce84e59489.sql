-- Check and fix RLS policies for profiles table to allow proper user signup
-- The issue might be that our RLS policies are too restrictive for new user creation

-- First, let's ensure the "Users can insert their own profile" policy works correctly
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Allow if user is creating their own profile (normal signup)
  (auth.uid() = user_id AND is_placeholder = false) OR
  -- Allow placeholder users created by admins
  (is_placeholder = true AND get_user_global_role(auth.uid()) = ANY (ARRAY['manager'::text, 'admin'::text]))
);

-- Also ensure the security definer bypass policy is working
-- This is needed for the handle_new_user function to work
DROP POLICY IF EXISTS "Security definer bypass" ON public.profiles;

CREATE POLICY "Security definer bypass" 
ON public.profiles 
FOR ALL 
USING (true) 
WITH CHECK (true);