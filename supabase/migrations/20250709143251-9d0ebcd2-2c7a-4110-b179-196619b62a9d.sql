
-- Enable RLS on projects table (it's already enabled, but just to be sure)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert projects
CREATE OR REPLACE POLICY "allow_authenticated_insert"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');
