-- Fix the UPDATE policy for timesheets to allow users to update their own timesheets when end_time is null
DROP POLICY IF EXISTS "Users can update own end_time if null, managers/admins update a" ON public.timesheets;

CREATE POLICY "Users can update own timesheets when end_time is null, managers/admins update all"
ON public.timesheets
FOR UPDATE 
TO authenticated
USING (
  (auth.uid() = user_id AND end_time IS NULL) OR 
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('manager', 'admin')
  ))
);