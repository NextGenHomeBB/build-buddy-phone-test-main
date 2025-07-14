-- Fix the UPDATE policy for timesheets to allow users to update their own timesheets
DROP POLICY IF EXISTS "Users can update own end_time if null, managers/admins update a" ON public.timesheets;
DROP POLICY IF EXISTS "Users can update own timesheets when end_time is null, managers/admins update all" ON public.timesheets;

CREATE POLICY "Users can update own timesheets, managers/admins update all"
ON public.timesheets
FOR UPDATE 
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('manager', 'admin')
  ))
);