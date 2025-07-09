-- Fix the get_current_user_role() function to handle unauthenticated users gracefully
-- This prevents infinite recursion when auth.uid() is null

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()),
    'worker'::user_role
  );
$function$;