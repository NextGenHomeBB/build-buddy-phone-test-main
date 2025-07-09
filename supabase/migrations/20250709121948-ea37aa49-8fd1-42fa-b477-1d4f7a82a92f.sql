-- Check and fix constraints for user_project_role table

-- First, let's drop any existing unique constraints that might be causing conflicts
DROP INDEX IF EXISTS user_project_role_user_id_project_id_role_key;
DROP INDEX IF EXISTS user_project_role_user_id_project_id_key;

-- Create the correct unique constraint that matches what the frontend expects
-- This ensures a user can only have one role per project (not multiple roles)
ALTER TABLE public.user_project_role 
DROP CONSTRAINT IF EXISTS user_project_role_user_id_project_id_key;

ALTER TABLE public.user_project_role 
ADD CONSTRAINT user_project_role_user_id_project_id_key 
UNIQUE (user_id, project_id);

-- Do the same for user_phase_role table
ALTER TABLE public.user_phase_role 
DROP CONSTRAINT IF EXISTS user_phase_role_user_id_phase_id_key;

ALTER TABLE public.user_phase_role 
ADD CONSTRAINT user_phase_role_user_id_phase_id_key 
UNIQUE (user_id, phase_id);

-- Also ensure RLS is enabled on both tables
ALTER TABLE public.user_project_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_phase_role ENABLE ROW LEVEL SECURITY;