-- Daily Schedule System Tables
-- Create schedules table - one row per calendar date
CREATE TABLE public.schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    work_date date UNIQUE NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create schedule items table - address/category blocks
CREATE TABLE public.schedule_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id uuid NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id),
    address text NOT NULL,
    category text NOT NULL CHECK (category IN ('normal', 'materials', 'storingen', 'specials')),
    start_time time NOT NULL,
    end_time time NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create schedule item workers table - link workers to items
CREATE TABLE public.schedule_item_workers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_item_id uuid NOT NULL REFERENCES public.schedule_items(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    is_assistant boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Create absences table
CREATE TABLE public.absences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    work_date date NOT NULL,
    user_id uuid NOT NULL,
    reason text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_item_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role_from_jwt()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.profiles WHERE user_id = auth.uid()),
    'worker'
  );
$$;

-- RLS Policies for schedules table
CREATE POLICY "Authenticated users can view schedules" 
ON public.schedules 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Managers and admins can insert schedules" 
ON public.schedules 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = created_by AND 
  get_current_user_role_from_jwt() IN ('manager', 'admin')
);

CREATE POLICY "Managers and admins can update schedules" 
ON public.schedules 
FOR UPDATE 
TO authenticated 
USING (get_current_user_role_from_jwt() IN ('manager', 'admin'));

CREATE POLICY "Managers and admins can delete schedules" 
ON public.schedules 
FOR DELETE 
TO authenticated 
USING (get_current_user_role_from_jwt() IN ('manager', 'admin'));

-- RLS Policies for schedule_items table
CREATE POLICY "Authenticated users can view schedule items" 
ON public.schedule_items 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Managers and admins can insert schedule items" 
ON public.schedule_items 
FOR INSERT 
TO authenticated 
WITH CHECK (get_current_user_role_from_jwt() IN ('manager', 'admin'));

CREATE POLICY "Managers and admins can update schedule items" 
ON public.schedule_items 
FOR UPDATE 
TO authenticated 
USING (get_current_user_role_from_jwt() IN ('manager', 'admin'));

CREATE POLICY "Managers and admins can delete schedule items" 
ON public.schedule_items 
FOR DELETE 
TO authenticated 
USING (get_current_user_role_from_jwt() IN ('manager', 'admin'));

-- RLS Policies for schedule_item_workers table
CREATE POLICY "Authenticated users can view schedule item workers" 
ON public.schedule_item_workers 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Managers and admins can insert schedule item workers" 
ON public.schedule_item_workers 
FOR INSERT 
TO authenticated 
WITH CHECK (get_current_user_role_from_jwt() IN ('manager', 'admin'));

CREATE POLICY "Managers and admins can update schedule item workers" 
ON public.schedule_item_workers 
FOR UPDATE 
TO authenticated 
USING (get_current_user_role_from_jwt() IN ('manager', 'admin'));

CREATE POLICY "Managers and admins can delete schedule item workers" 
ON public.schedule_item_workers 
FOR DELETE 
TO authenticated 
USING (get_current_user_role_from_jwt() IN ('manager', 'admin'));

-- RLS Policies for absences table
CREATE POLICY "Authenticated users can view absences" 
ON public.absences 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Managers and admins can insert absences" 
ON public.absences 
FOR INSERT 
TO authenticated 
WITH CHECK (get_current_user_role_from_jwt() IN ('manager', 'admin'));

CREATE POLICY "Managers and admins can update absences" 
ON public.absences 
FOR UPDATE 
TO authenticated 
USING (get_current_user_role_from_jwt() IN ('manager', 'admin'));

CREATE POLICY "Managers and admins can delete absences" 
ON public.absences 
FOR DELETE 
TO authenticated 
USING (get_current_user_role_from_jwt() IN ('manager', 'admin'));

-- Add indexes for better performance
CREATE INDEX idx_schedules_work_date ON public.schedules(work_date);
CREATE INDEX idx_schedule_items_schedule_id ON public.schedule_items(schedule_id);
CREATE INDEX idx_schedule_item_workers_schedule_item_id ON public.schedule_item_workers(schedule_item_id);
CREATE INDEX idx_schedule_item_workers_user_id ON public.schedule_item_workers(user_id);
CREATE INDEX idx_absences_work_date ON public.absences(work_date);
CREATE INDEX idx_absences_user_id ON public.absences(user_id);