-- Fix infinite recursion in user_project_role policies
-- First, create a security definer function to get user role without causing recursion
CREATE OR REPLACE FUNCTION public.get_user_global_role(user_id_param UUID)
RETURNS TEXT AS $$
BEGIN
  -- Get the user's global role from profiles table
  RETURN (
    SELECT role::TEXT 
    FROM public.profiles 
    WHERE user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Managers can manage user roles for their projects" ON public.user_project_role;
DROP POLICY IF EXISTS "Managers can manage user phase roles for their projects" ON public.user_phase_role;

-- Create new policies using the security definer function
CREATE POLICY "Managers can manage user roles for their projects" 
ON public.user_project_role 
FOR ALL 
USING (
  get_user_global_role(auth.uid()) = 'admin' OR
  (
    get_user_global_role(auth.uid()) = 'manager' AND 
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = user_project_role.project_id AND manager_id = auth.uid()
    )
  )
);

CREATE POLICY "Managers can manage user phase roles for their projects" 
ON public.user_phase_role 
FOR ALL 
USING (
  get_user_global_role(auth.uid()) = 'admin' OR
  (
    get_user_global_role(auth.uid()) = 'manager' AND 
    EXISTS (
      SELECT 1 FROM public.project_phases pp
      JOIN public.projects p ON p.id = pp.project_id
      WHERE pp.id = user_phase_role.phase_id AND p.manager_id = auth.uid()
    )
  )
);