-- Add manager_id column to projects table
ALTER TABLE public.projects ADD COLUMN manager_id uuid;

-- Add foreign key constraints
ALTER TABLE public.projects 
ADD CONSTRAINT projects_manager_id_fkey 
FOREIGN KEY (manager_id) REFERENCES public.profiles(id);

ALTER TABLE public.user_project_role 
ADD CONSTRAINT user_project_role_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.user_project_role 
ADD CONSTRAINT user_project_role_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id);

ALTER TABLE public.project_phases 
ADD CONSTRAINT project_phases_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id);

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id);

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_phase_id_fkey 
FOREIGN KEY (phase_id) REFERENCES public.project_phases(id);

ALTER TABLE public.labour_entries 
ADD CONSTRAINT labour_entries_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id);

ALTER TABLE public.labour_entries 
ADD CONSTRAINT labour_entries_task_id_fkey 
FOREIGN KEY (task_id) REFERENCES public.tasks(id);

ALTER TABLE public.worker_costs 
ADD CONSTRAINT worker_costs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.checklists 
ADD CONSTRAINT checklists_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id);

ALTER TABLE public.checklists 
ADD CONSTRAINT checklists_phase_id_fkey 
FOREIGN KEY (phase_id) REFERENCES public.project_phases(id);

ALTER TABLE public.materials 
ADD CONSTRAINT materials_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id);

ALTER TABLE public.materials 
ADD CONSTRAINT materials_catalog_id_fkey 
FOREIGN KEY (catalog_id) REFERENCES public.material_catalog(id);

-- Add a computed column or alias for name to profiles table for backward compatibility
-- We'll add a view that aliases full_name as name
CREATE OR REPLACE VIEW public.profiles_with_name AS 
SELECT *, full_name as name FROM public.profiles;