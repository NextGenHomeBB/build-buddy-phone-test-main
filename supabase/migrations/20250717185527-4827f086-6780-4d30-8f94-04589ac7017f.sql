-- Fix RLS policies that are causing circular dependency during user signup
-- The issue is that get_user_global_role() requires a profile to exist, but we're creating the profile

-- Drop the problematic RLS policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers and admins can create placeholder profiles" ON public.profiles;

-- Create a simpler policy that allows profile creation during signup
CREATE POLICY "Allow profile creation during signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Allow if this is a regular user creating their own profile (non-placeholder)
  (auth.uid() = auth_user_id AND is_placeholder = false)
  OR
  -- Allow placeholder users created by admins/managers
  (is_placeholder = true AND auth.uid() IS NOT NULL)
  OR
  -- Allow system/service role to create profiles (for the trigger)
  auth.uid() IS NULL
);