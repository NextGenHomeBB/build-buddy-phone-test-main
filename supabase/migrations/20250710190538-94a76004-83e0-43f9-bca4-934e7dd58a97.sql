-- Create material_costs table
CREATE TABLE public.material_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES public.project_phases(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  qty NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create labour_costs table
CREATE TABLE public.labour_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES public.project_phases(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  subcontractor_id UUID NULL,
  hours NUMERIC NOT NULL DEFAULT 0,
  rate NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add remaining_budget column to projects
ALTER TABLE public.projects ADD COLUMN remaining_budget NUMERIC NOT NULL DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.material_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labour_costs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for material_costs
CREATE POLICY "Admin and managers can manage material costs" 
ON public.material_costs 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Workers can view material costs for assigned projects" 
ON public.material_costs 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'worker'
  ) AND 
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN project_phases pp ON pp.id = t.phase_id
    WHERE pp.id = material_costs.phase_id 
    AND t.assigned_to = auth.uid()
  )
);

-- Create RLS policies for labour_costs  
CREATE POLICY "Admin and managers can manage labour costs" 
ON public.labour_costs 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  )
);

CREATE POLICY "Workers can view labour costs for assigned projects" 
ON public.labour_costs 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'worker'
  ) AND 
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN project_phases pp ON pp.id = t.phase_id
    WHERE pp.id = labour_costs.phase_id 
    AND t.assigned_to = auth.uid()
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_material_costs_updated_at
BEFORE UPDATE ON public.material_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_labour_costs_updated_at
BEFORE UPDATE ON public.labour_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();