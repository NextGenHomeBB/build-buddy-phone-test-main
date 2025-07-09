-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin and manager insert
CREATE OR REPLACE POLICY "allow_admin_or_manager_insert"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);