-- Create task_workers junction table for multiple worker assignments
CREATE TABLE public.task_workers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    is_primary boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(task_id, user_id)
);

-- Add approval fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN approved_at timestamptz,
ADD COLUMN approved_by uuid,
ADD COLUMN signature_url text;

-- Enable RLS on task_workers
ALTER TABLE public.task_workers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_workers
CREATE POLICY "Managers and admins can insert/delete task workers" 
ON public.task_workers 
FOR INSERT, DELETE
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('manager', 'admin')
    )
);

CREATE POLICY "Authenticated users can view task workers for same project" 
ON public.task_workers 
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tasks t
        JOIN public.user_project_role upr ON upr.project_id = t.project_id
        WHERE t.id = task_workers.task_id 
        AND upr.user_id = auth.uid()
    )
);

CREATE POLICY "Only admins can update task workers" 
ON public.task_workers 
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Update tasks RLS for approval fields
CREATE POLICY "Managers can approve tasks in review"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
    (approved_at IS NULL OR approved_by IS NULL OR signature_url IS NULL) AND
    (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('manager', 'admin')
        )
        OR 
        (
            status = 'review' AND
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE user_id = auth.uid() 
                AND role = 'manager'
            )
        )
    )
);