-- Create timesheets table
CREATE TABLE public.timesheets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_item_id uuid REFERENCES public.schedule_items(id),
    project_id uuid REFERENCES public.projects(id),
    phase_id uuid REFERENCES public.project_phases(id),
    start_time timestamptz NOT NULL DEFAULT now(),
    end_time timestamptz,
    duration_generated numeric,
    approved boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own timesheets"
ON public.timesheets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own timesheets, managers/admins view all"
ON public.timesheets
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() 
        AND role IN ('manager', 'admin')
    )
);

CREATE POLICY "Users can update own end_time if null, managers/admins update any except user_id"
ON public.timesheets
FOR UPDATE
TO authenticated
USING (
    (auth.uid() = user_id AND end_time IS NULL) OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() 
        AND role IN ('manager', 'admin')
    )
)
WITH CHECK (
    (auth.uid() = user_id AND OLD.user_id = NEW.user_id) OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() 
        AND role IN ('manager', 'admin')
    )
);

CREATE POLICY "Only admins can delete timesheets"
ON public.timesheets
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Trigger function to calculate duration
CREATE OR REPLACE FUNCTION public.calc_duration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only calculate duration when end_time is set and not null
    IF NEW.end_time IS NOT NULL THEN
        NEW.duration_generated := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0;
    END IF;
    
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER calc_duration_trigger
    BEFORE UPDATE ON public.timesheets
    FOR EACH ROW
    EXECUTE FUNCTION public.calc_duration();

-- Function to assign unassigned tasks
CREATE OR REPLACE FUNCTION public.assign_unassigned_tasks(work_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    schedule_worker RECORD;
    unassigned_task RECORD;
BEGIN
    -- For each schedule item worker combination on the given date
    FOR schedule_worker IN
        SELECT 
            siw.user_id,
            si.project_id,
            pp.id as phase_id
        FROM public.schedules s
        JOIN public.schedule_items si ON si.schedule_id = s.id
        JOIN public.schedule_item_workers siw ON siw.schedule_item_id = si.id
        LEFT JOIN public.project_phases pp ON pp.project_id = si.project_id
        WHERE s.work_date = work_date
    LOOP
        -- Find unassigned tasks in the same phase/project
        FOR unassigned_task IN
            SELECT t.id
            FROM public.tasks t
            WHERE t.project_id = schedule_worker.project_id
            AND (t.phase_id = schedule_worker.phase_id OR schedule_worker.phase_id IS NULL)
            AND t.assigned_to IS NULL
            AND t.status = 'todo'
            LIMIT 5  -- Assign max 5 tasks per worker per day
        LOOP
            -- Assign the task to the worker
            UPDATE public.tasks
            SET assigned_to = schedule_worker.user_id,
                updated_at = now()
            WHERE id = unassigned_task.id;
        END LOOP;
    END LOOP;
END;
$$;