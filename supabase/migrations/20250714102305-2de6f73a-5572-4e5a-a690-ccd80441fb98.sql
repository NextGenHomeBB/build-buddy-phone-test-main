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

-- RLS Policies for task_workers - INSERT
CREATE POLICY "Managers and admins can insert task workers" 
ON public.task_workers 
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('manager', 'admin')
    )
);

-- RLS Policies for task_workers - DELETE
CREATE POLICY "Managers and admins can delete task workers" 
ON public.task_workers 
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('manager', 'admin')
    )
);

-- RLS Policies for task_workers - SELECT
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

-- RLS Policies for task_workers - UPDATE
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
CREATE POLICY "Managers can approve tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('manager', 'admin')
    )
);