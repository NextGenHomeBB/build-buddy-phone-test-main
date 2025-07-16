-- Create checklist_items table for the new phase-aware workflow
CREATE TABLE public.checklist_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    is_done boolean NOT NULL DEFAULT false,
    assignee_id uuid REFERENCES public.profiles(user_id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX idx_checklist_items_task_id ON public.checklist_items(task_id);
CREATE INDEX idx_checklist_items_assignee_id ON public.checklist_items(assignee_id);

-- Enable RLS
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view checklist items for assigned projects"
ON public.checklist_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tasks t
        JOIN public.user_project_role upr ON upr.project_id = t.project_id
        WHERE t.id = checklist_items.task_id 
        AND upr.user_id = auth.uid()
    )
);

CREATE POLICY "Managers and admins can insert checklist items"
ON public.checklist_items
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('manager', 'admin')
    )
);

CREATE POLICY "Managers and admins can update checklist items"
ON public.checklist_items
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('manager', 'admin')
    )
);

CREATE POLICY "Workers can update their assigned checklist items"
ON public.checklist_items
FOR UPDATE
TO authenticated
USING (assignee_id = auth.uid());

CREATE POLICY "Managers and admins can delete checklist items"
ON public.checklist_items
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('manager', 'admin')
    )
);

-- Create trigger for updated_at
CREATE TRIGGER update_checklist_items_updated_at
    BEFORE UPDATE ON public.checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();