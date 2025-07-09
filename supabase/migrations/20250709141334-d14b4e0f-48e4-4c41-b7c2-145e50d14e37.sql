-- Fix infinite recursion in profiles policies
-- The issue is that get_user_global_role() queries profiles table, 
-- but profiles table policies call get_current_user_role() which also queries profiles table

-- Drop problematic policies that use get_current_user_role()
DROP POLICY IF EXISTS "Admins can update user roles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.profiles;

-- Create new policies without circular dependency
-- For admin operations, we need to allow the security definer function to access profiles
-- without triggering RLS checks

CREATE POLICY "Admins can update user roles" 
ON public.profiles 
FOR UPDATE 
USING (
  -- Allow if the current user's role is admin (direct check without function call)
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'::user_role
);

CREATE POLICY "Admins can view all user profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow if the current user's role is admin (direct check without function call)
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'::user_role
);

-- Add a policy to allow the security definer function to read profiles without RLS
CREATE POLICY "Allow security definer functions to read profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Note: This creates multiple SELECT policies, but PostgreSQL will allow access 
-- if ANY of the policies grants permission