-- Create schedules table to store daily schedules
CREATE TABLE public.schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_date DATE NOT NULL,
  created_by UUID NOT NULL,
  organization_id UUID NOT NULL DEFAULT current_org(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(work_date, organization_id)
);

-- Enable Row Level Security
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for schedules
CREATE POLICY "Schedules: admin manage" 
ON public.schedules 
FOR ALL 
USING (organization_id = current_org() AND get_current_user_role() = 'admin');

CREATE POLICY "Schedules: org members read" 
ON public.schedules 
FOR SELECT 
USING (organization_id = current_org());

-- Create schedule_items table to store individual schedule entries
CREATE TABLE public.schedule_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'normal' CHECK (category IN ('normal', 'materials', 'storingen', 'specials')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  organization_id UUID NOT NULL DEFAULT current_org(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;

-- Create policies for schedule_items
CREATE POLICY "ScheduleItems: admin manage" 
ON public.schedule_items 
FOR ALL 
USING (organization_id = current_org() AND get_current_user_role() = 'admin');

CREATE POLICY "ScheduleItems: org members read" 
ON public.schedule_items 
FOR SELECT 
USING (organization_id = current_org());

-- Create schedule_item_workers table to track worker assignments
CREATE TABLE public.schedule_item_workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_item_id UUID NOT NULL REFERENCES public.schedule_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_assistant BOOLEAN NOT NULL DEFAULT false,
  organization_id UUID NOT NULL DEFAULT current_org(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(schedule_item_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.schedule_item_workers ENABLE ROW LEVEL SECURITY;

-- Create policies for schedule_item_workers
CREATE POLICY "ScheduleItemWorkers: admin manage" 
ON public.schedule_item_workers 
FOR ALL 
USING (organization_id = current_org() AND get_current_user_role() = 'admin');

CREATE POLICY "ScheduleItemWorkers: org members read" 
ON public.schedule_item_workers 
FOR SELECT 
USING (organization_id = current_org());

-- Create trigger for automatic timestamp updates on schedules
CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON public.schedules
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create trigger for automatic timestamp updates on schedule_items
CREATE TRIGGER update_schedule_items_updated_at
BEFORE UPDATE ON public.schedule_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create trigger for automatic timestamp updates on schedule_item_workers
CREATE TRIGGER update_schedule_item_workers_updated_at
BEFORE UPDATE ON public.schedule_item_workers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();