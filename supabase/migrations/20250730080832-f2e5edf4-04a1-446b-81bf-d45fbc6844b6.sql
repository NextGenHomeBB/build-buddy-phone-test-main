-- Create missing tables for the worker app

-- Create project_phases table
CREATE TABLE public.project_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  phase_id UUID,
  project_id UUID NOT NULL,
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create labour_entries table
CREATE TABLE public.labour_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  hours_worked NUMERIC NOT NULL DEFAULT 0,
  hourly_rate NUMERIC,
  total_cost NUMERIC GENERATED ALWAYS AS (hours_worked * COALESCE(hourly_rate, 0)) STORED,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklists table
CREATE TABLE public.checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_id UUID,
  phase_id UUID,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklist_items table
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  assigned_to UUID,
  completed_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create worker_costs table
CREATE TABLE public.worker_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labour_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_costs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_phases
CREATE POLICY "ProjectPhases: org members read" 
ON public.project_phases 
FOR SELECT 
USING (organization_id = current_org());

CREATE POLICY "ProjectPhases: admin manage" 
ON public.project_phases 
FOR ALL 
USING ((organization_id = current_org()) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text));

-- Create RLS policies for tasks
CREATE POLICY "Tasks: org members read" 
ON public.tasks 
FOR SELECT 
USING (organization_id = current_org());

CREATE POLICY "Tasks: admin manage" 
ON public.tasks 
FOR ALL 
USING ((organization_id = current_org()) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text));

CREATE POLICY "Tasks: assigned user update" 
ON public.tasks 
FOR UPDATE 
USING ((organization_id = current_org()) AND (assigned_to = auth.uid()));

-- Create RLS policies for labour_entries
CREATE POLICY "LabourEntries: org members read" 
ON public.labour_entries 
FOR SELECT 
USING (organization_id = current_org());

CREATE POLICY "LabourEntries: owner insert" 
ON public.labour_entries 
FOR INSERT 
WITH CHECK ((organization_id = current_org()) AND (user_id = auth.uid()));

CREATE POLICY "LabourEntries: owner update" 
ON public.labour_entries 
FOR UPDATE 
USING ((organization_id = current_org()) AND (user_id = auth.uid()));

CREATE POLICY "LabourEntries: admin manage" 
ON public.labour_entries 
FOR ALL 
USING ((organization_id = current_org()) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text));

-- Create RLS policies for checklists
CREATE POLICY "Checklists: org members read" 
ON public.checklists 
FOR SELECT 
USING (organization_id = current_org());

CREATE POLICY "Checklists: admin manage" 
ON public.checklists 
FOR ALL 
USING ((organization_id = current_org()) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text));

-- Create RLS policies for checklist_items
CREATE POLICY "ChecklistItems: org members read" 
ON public.checklist_items 
FOR SELECT 
USING (organization_id = current_org());

CREATE POLICY "ChecklistItems: admin manage" 
ON public.checklist_items 
FOR ALL 
USING ((organization_id = current_org()) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text));

CREATE POLICY "ChecklistItems: assigned user update" 
ON public.checklist_items 
FOR UPDATE 
USING ((organization_id = current_org()) AND (assigned_to = auth.uid()));

-- Create RLS policies for worker_costs
CREATE POLICY "WorkerCosts: org members read" 
ON public.worker_costs 
FOR SELECT 
USING (organization_id = current_org());

CREATE POLICY "WorkerCosts: admin manage" 
ON public.worker_costs 
FOR ALL 
USING ((organization_id = current_org()) AND ((auth.jwt() ->> 'role'::text) = 'admin'::text));

-- Create update triggers for updated_at columns
CREATE TRIGGER update_project_phases_updated_at
BEFORE UPDATE ON public.project_phases
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_labour_entries_updated_at
BEFORE UPDATE ON public.labour_entries
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_checklists_updated_at
BEFORE UPDATE ON public.checklists
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_checklist_items_updated_at
BEFORE UPDATE ON public.checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_worker_costs_updated_at
BEFORE UPDATE ON public.worker_costs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();