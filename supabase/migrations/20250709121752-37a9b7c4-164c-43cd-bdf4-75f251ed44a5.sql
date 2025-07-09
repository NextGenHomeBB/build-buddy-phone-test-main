-- Fix RLS policies for user_project_role table to allow managers to manage user access for their projects

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all user project roles" ON public.user_project_role;
DROP POLICY IF EXISTS "Managers can view project roles for their projects" ON public.user_project_role;
DROP POLICY IF EXISTS "Users can view their own project roles" ON public.user_project_role;

-- Create new comprehensive policies for user_project_role
CREATE POLICY "Admins can manage all user project roles" 
ON public.user_project_role 
FOR ALL 
USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Managers can manage user roles for their projects" 
ON public.user_project_role 
FOR ALL 
USING (
  get_current_user_role() = 'manager'::user_role 
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = user_project_role.project_id 
    AND projects.manager_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own project roles" 
ON public.user_project_role 
FOR SELECT 
USING (user_id = auth.uid());

-- Fix RLS policies for user_phase_role table as well

-- Drop existing policies  
DROP POLICY IF EXISTS "Admins can manage all user phase roles" ON public.user_phase_role;
DROP POLICY IF EXISTS "Managers can view phase roles for their projects" ON public.user_phase_role;
DROP POLICY IF EXISTS "Users can view their own phase roles" ON public.user_phase_role;

-- Create new comprehensive policies for user_phase_role
CREATE POLICY "Admins can manage all user phase roles" 
ON public.user_phase_role 
FOR ALL 
USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Managers can manage user phase roles for their projects" 
ON public.user_phase_role 
FOR ALL 
USING (
  get_current_user_role() = 'manager'::user_role 
  AND EXISTS (
    SELECT 1 FROM project_phases pp
    JOIN projects p ON p.id = pp.project_id
    WHERE pp.id = user_phase_role.phase_id 
    AND p.manager_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own phase roles" 
ON public.user_phase_role 
FOR SELECT 
USING (user_id = auth.uid());