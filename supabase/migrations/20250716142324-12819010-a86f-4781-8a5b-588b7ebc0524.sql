
-- Create labour_entries table for tracking labour time and costs
CREATE TABLE public.labour_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id uuid REFERENCES public.project_phases(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  task_description text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  total_hours numeric GENERATED ALWAYS AS (
    CASE 
      WHEN end_time IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0
      ELSE 0
    END
  ) STORED,
  hourly_rate numeric NOT NULL DEFAULT 0,
  total_cost numeric GENERATED ALWAYS AS (
    CASE 
      WHEN end_time IS NOT NULL THEN 
        (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0) * hourly_rate
      ELSE 0
    END
  ) STORED,
  break_duration_minutes integer DEFAULT 0,
  notes text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.labour_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view labour entries for assigned projects"
ON public.labour_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_project_role upr
    WHERE upr.user_id = auth.uid() 
    AND upr.project_id = labour_entries.project_id
  )
);

CREATE POLICY "Users can create their own labour entries"
ON public.labour_entries
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.user_project_role upr
    WHERE upr.user_id = auth.uid() 
    AND upr.project_id = labour_entries.project_id
  )
);

CREATE POLICY "Users can update their own labour entries"
ON public.labour_entries
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.user_project_role upr
    WHERE upr.user_id = auth.uid() 
    AND upr.project_id = labour_entries.project_id
  )
);

CREATE POLICY "Managers and admins can manage all labour entries"
ON public.labour_entries
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() 
    AND role IN ('manager', 'admin')
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_labour_entries_updated_at
  BEFORE UPDATE ON public.labour_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_labour_entries_project_id ON public.labour_entries(project_id);
CREATE INDEX idx_labour_entries_user_id ON public.labour_entries(user_id);
CREATE INDEX idx_labour_entries_phase_id ON public.labour_entries(phase_id);
CREATE INDEX idx_labour_entries_status ON public.labour_entries(status);
