-- Fix the timesheets RLS policy using security definer function to prevent infinite recursion

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Users can update own timesheets, managers/admins update all" ON public.timesheets;
DROP POLICY IF EXISTS "Users can update own timesheets when end_time is null, managers/admins update all" ON public.timesheets;
DROP POLICY IF EXISTS "Users can update own end_time if null, managers/admins update a" ON public.timesheets;

-- Create a simple policy that allows users to update their own timesheets
CREATE POLICY "Users can update own timesheets, managers/admins update all"
ON public.timesheets
FOR UPDATE 
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (get_current_user_role_from_jwt() = ANY (ARRAY['manager', 'admin']))
);