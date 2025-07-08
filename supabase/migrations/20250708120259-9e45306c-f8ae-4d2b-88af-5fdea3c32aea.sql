-- Update the RLS policy to allow workers to create projects
DROP POLICY IF EXISTS "Admin and managers can create projects" ON public.projects;

CREATE POLICY "Admin, managers, and workers can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'manager'::user_role, 'worker'::user_role]));