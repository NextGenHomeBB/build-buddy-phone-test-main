-- Create user_project_role table for managing user roles within projects
CREATE TABLE public.user_project_role (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'worker',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  organization_id uuid NOT NULL DEFAULT current_org(),
  
  -- Ensure one role per user per project
  UNIQUE(user_id, project_id)
);

-- Enable RLS
ALTER TABLE public.user_project_role ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "UserProjectRole: admin manage"
ON public.user_project_role
FOR ALL
USING (organization_id = current_org() AND (auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "UserProjectRole: org members read"
ON public.user_project_role
FOR SELECT
USING (organization_id = current_org());

-- Add updated_at trigger
CREATE TRIGGER set_user_project_role_updated_at
  BEFORE UPDATE ON public.user_project_role
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();