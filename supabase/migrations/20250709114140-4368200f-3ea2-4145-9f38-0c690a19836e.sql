-- Create user_project_role table for project-level access control
CREATE TABLE public.user_project_role (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'worker')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id, role)
);

-- Create user_phase_role table for phase-level access control
CREATE TABLE public.user_phase_role (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phase_id UUID NOT NULL REFERENCES public.project_phases(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'worker')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, phase_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.user_project_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_phase_role ENABLE ROW LEVEL SECURITY;

-- Create policies for user_project_role
CREATE POLICY "Admins can manage all user project roles" 
ON public.user_project_role 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Managers can view project roles for their projects" 
ON public.user_project_role 
FOR SELECT 
USING (
  get_current_user_role() = 'manager' AND 
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND manager_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own project roles" 
ON public.user_project_role 
FOR SELECT 
USING (user_id = auth.uid());

-- Create policies for user_phase_role
CREATE POLICY "Admins can manage all user phase roles" 
ON public.user_phase_role 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Managers can view phase roles for their projects" 
ON public.user_phase_role 
FOR SELECT 
USING (
  get_current_user_role() = 'manager' AND 
  EXISTS (
    SELECT 1 FROM public.project_phases pp
    JOIN public.projects p ON p.id = pp.project_id
    WHERE pp.id = phase_id AND p.manager_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own phase roles" 
ON public.user_phase_role 
FOR SELECT 
USING (user_id = auth.uid());

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_project_role_updated_at
BEFORE UPDATE ON public.user_project_role
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_phase_role_updated_at
BEFORE UPDATE ON public.user_phase_role
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_project_role_user_id ON public.user_project_role(user_id);
CREATE INDEX idx_user_project_role_project_id ON public.user_project_role(project_id);
CREATE INDEX idx_user_phase_role_user_id ON public.user_phase_role(user_id);
CREATE INDEX idx_user_phase_role_phase_id ON public.user_phase_role(phase_id);