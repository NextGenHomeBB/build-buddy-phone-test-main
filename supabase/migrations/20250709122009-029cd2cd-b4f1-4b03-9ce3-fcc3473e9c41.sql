-- Fix the constraint properly by dropping the existing one and creating the correct one

-- Drop the existing constraint that includes 'role' which doesn't match frontend expectation
ALTER TABLE public.user_project_role 
DROP CONSTRAINT IF EXISTS user_project_role_user_id_project_id_role_key;

-- Create the correct unique constraint (user_id, project_id only - a user can only have one role per project)
ALTER TABLE public.user_project_role 
ADD CONSTRAINT user_project_role_user_id_project_id_key 
UNIQUE (user_id, project_id);

-- Do the same for user_phase_role table
ALTER TABLE public.user_phase_role 
DROP CONSTRAINT IF EXISTS user_phase_role_user_id_phase_id_role_key;

ALTER TABLE public.user_phase_role 
ADD CONSTRAINT user_phase_role_user_id_phase_id_key 
UNIQUE (user_id, phase_id);