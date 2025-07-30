-- Add manager_id column to projects table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'manager_id') THEN
        ALTER TABLE public.projects ADD COLUMN manager_id uuid;
    END IF;
END $$;

-- Add foreign key constraints only if they don't exist
DO $$ 
BEGIN
    -- Projects manager_id foreign key
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'projects_manager_id_fkey') THEN
        ALTER TABLE public.projects ADD CONSTRAINT projects_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(id);
    END IF;

    -- User project role foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_project_role_user_id_fkey') THEN
        ALTER TABLE public.user_project_role ADD CONSTRAINT user_project_role_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_project_role_project_id_fkey') THEN
        ALTER TABLE public.user_project_role ADD CONSTRAINT user_project_role_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);
    END IF;

    -- Project phases foreign key
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'project_phases_project_id_fkey') THEN
        ALTER TABLE public.project_phases ADD CONSTRAINT project_phases_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);
    END IF;

    -- Tasks foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_project_id_fkey') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_phase_id_fkey') THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_phase_id_fkey FOREIGN KEY (phase_id) REFERENCES public.project_phases(id);
    END IF;

    -- Labour entries foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'labour_entries_project_id_fkey') THEN
        ALTER TABLE public.labour_entries ADD CONSTRAINT labour_entries_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'labour_entries_task_id_fkey') THEN
        ALTER TABLE public.labour_entries ADD CONSTRAINT labour_entries_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);
    END IF;

    -- Worker costs foreign key
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'worker_costs_user_id_fkey') THEN
        ALTER TABLE public.worker_costs ADD CONSTRAINT worker_costs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    END IF;

    -- Checklists foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'checklists_project_id_fkey') THEN
        ALTER TABLE public.checklists ADD CONSTRAINT checklists_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'checklists_phase_id_fkey') THEN
        ALTER TABLE public.checklists ADD CONSTRAINT checklists_phase_id_fkey FOREIGN KEY (phase_id) REFERENCES public.project_phases(id);
    END IF;

    -- Materials catalog foreign key (skip project_id as it already exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'materials_catalog_id_fkey') THEN
        ALTER TABLE public.materials ADD CONSTRAINT materials_catalog_id_fkey FOREIGN KEY (catalog_id) REFERENCES public.material_catalog(id);
    END IF;
END $$;