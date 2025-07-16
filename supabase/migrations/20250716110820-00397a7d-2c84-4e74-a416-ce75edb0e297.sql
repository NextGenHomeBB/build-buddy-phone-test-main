-- Allow workers to insert their own project roles when they're assigned to tasks
-- This is needed for the auto-assignment trigger in task updates

-- Add policy to allow users to insert their own project roles
CREATE POLICY "Users can insert their own project roles" 
ON public.user_project_role
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add policy to allow users to update their own project roles  
CREATE POLICY "Users can update their own project roles"
ON public.user_project_role
FOR UPDATE 
USING (auth.uid() = user_id);