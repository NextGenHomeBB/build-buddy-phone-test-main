-- Fix infinite recursion in profiles RLS policy
-- Drop the problematic policy that creates circular dependency
DROP POLICY IF EXISTS "Managers and admins can create placeholder profiles" ON public.profiles;

-- Create the corrected policy using the security definer function
CREATE POLICY "Managers and admins can create placeholder profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  is_placeholder = true AND 
  get_user_global_role(auth.uid()) = ANY (ARRAY['manager', 'admin'])
);