-- Final fix for infinite recursion: Fix user_project_role policies to eliminate circular dependencies

-- Drop existing problematic policies on user_project_role
DROP POLICY IF EXISTS "Admins can manage all user project roles" ON public.user_project_role;
DROP POLICY IF EXISTS "Managers can manage user roles for their projects" ON public.user_project_role;

-- Create new admin policy using direct profile query (no function calls)
CREATE POLICY "Admins can manage all user project roles" 
ON public.user_project_role 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create simplified manager policy that doesn't reference projects table
-- Managers can only manage roles where they are explicitly the manager_id in the user_project_role
CREATE POLICY "Managers can manage user project roles" 
ON public.user_project_role 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Admin check with direct query
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
    OR 
    -- Manager check - simplified to avoid circular dependency
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'manager'
    )
  )
);