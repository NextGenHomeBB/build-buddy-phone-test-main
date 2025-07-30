-- Create missing tables and fix profile column issues

-- First, add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_user_id UUID,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT false;

-- Update name column to use full_name as fallback
UPDATE public.profiles SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;

-- Create task_workers table
CREATE TABLE IF NOT EXISTS public.task_workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT current_org(),
  
  CONSTRAINT fk_task_workers_task FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_workers_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'ui', 'other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  attachment_url TEXT,
  external_issue_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT current_org(),
  
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_project FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL DEFAULT current_org(),
  
  CONSTRAINT fk_task_comments_task FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_comments_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS on new tables
ALTER TABLE public.task_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_workers
CREATE POLICY "TaskWorkers: admin manage" ON public.task_workers
FOR ALL USING (
  organization_id = current_org() AND 
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "TaskWorkers: org members read" ON public.task_workers
FOR SELECT USING (organization_id = current_org());

-- Create RLS policies for feedback
CREATE POLICY "Feedback: admin manage" ON public.feedback
FOR ALL USING (
  organization_id = current_org() AND 
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "Feedback: user manage own" ON public.feedback
FOR ALL USING (
  organization_id = current_org() AND 
  user_id = auth.uid()
);

CREATE POLICY "Feedback: org members read" ON public.feedback
FOR SELECT USING (organization_id = current_org());

-- Create RLS policies for task_comments
CREATE POLICY "TaskComments: admin manage" ON public.task_comments
FOR ALL USING (
  organization_id = current_org() AND 
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "TaskComments: user manage own" ON public.task_comments
FOR ALL USING (
  organization_id = current_org() AND 
  user_id = auth.uid()
);

CREATE POLICY "TaskComments: org members read" ON public.task_comments
FOR SELECT USING (organization_id = current_org());

-- Create updated_at triggers for new tables
CREATE TRIGGER set_task_workers_updated_at
  BEFORE UPDATE ON public.task_workers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();