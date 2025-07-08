-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on-hold', 'completed', 'cancelled');
CREATE TYPE project_type AS ENUM ('residential', 'commercial', 'infrastructure', 'renovation');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'worker', 'viewer');
CREATE TYPE task_status AS ENUM ('todo', 'in-progress', 'review', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'worker',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type project_type NOT NULL DEFAULT 'residential',
  status project_status NOT NULL DEFAULT 'planning',
  location TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  spent DECIMAL(12,2) NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  manager_id UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project phases table
CREATE TABLE public.project_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status project_status NOT NULL DEFAULT 'planning',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  spent DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.project_phases(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(user_id),
  assigned_by UUID REFERENCES public.profiles(user_id),
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'todo',
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),
  tags TEXT[],
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create materials table
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project materials table
CREATE TABLE public.project_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity_needed DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity_used DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, material_id)
);

-- Create time sheets table
CREATE TABLE public.time_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL CHECK (hours >= 0),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklists table
CREATE TABLE public.checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project checklists table
CREATE TABLE public.project_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  completed_items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, checklist_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_checklists ENABLE ROW LEVEL SECURITY;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for projects
CREATE POLICY "All authenticated users can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and managers can create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('admin', 'manager'));
CREATE POLICY "Admin and managers can update projects" ON public.projects FOR UPDATE TO authenticated USING (public.get_current_user_role() IN ('admin', 'manager'));
CREATE POLICY "Only admin can delete projects" ON public.projects FOR DELETE TO authenticated USING (public.get_current_user_role() = 'admin');

-- Create policies for project phases
CREATE POLICY "All authenticated users can view project phases" ON public.project_phases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and managers can manage project phases" ON public.project_phases FOR ALL TO authenticated USING (public.get_current_user_role() IN ('admin', 'manager'));

-- Create policies for tasks
CREATE POLICY "Users can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and managers can create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() IN ('admin', 'manager'));
CREATE POLICY "Admin, managers, and assigned users can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (
  public.get_current_user_role() IN ('admin', 'manager') OR assigned_to = auth.uid()
);
CREATE POLICY "Admin and managers can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (public.get_current_user_role() IN ('admin', 'manager'));

-- Create policies for task comments
CREATE POLICY "Users can view task comments" ON public.task_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create task comments" ON public.task_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.task_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.task_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create policies for materials
CREATE POLICY "All authenticated users can view materials" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and managers can manage materials" ON public.materials FOR ALL TO authenticated USING (public.get_current_user_role() IN ('admin', 'manager'));

-- Create policies for project materials
CREATE POLICY "All authenticated users can view project materials" ON public.project_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and managers can manage project materials" ON public.project_materials FOR ALL TO authenticated USING (public.get_current_user_role() IN ('admin', 'manager'));

-- Create policies for time sheets
CREATE POLICY "Users can view their own time sheets" ON public.time_sheets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin and managers can view all time sheets" ON public.time_sheets FOR SELECT TO authenticated USING (public.get_current_user_role() IN ('admin', 'manager'));
CREATE POLICY "Users can create their own time sheets" ON public.time_sheets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own time sheets" ON public.time_sheets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own time sheets" ON public.time_sheets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create policies for checklists
CREATE POLICY "All authenticated users can view checklists" ON public.checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and managers can manage checklists" ON public.checklists FOR ALL TO authenticated USING (public.get_current_user_role() IN ('admin', 'manager'));

-- Create policies for project checklists
CREATE POLICY "All authenticated users can view project checklists" ON public.project_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and managers can manage project checklists" ON public.project_checklists FOR ALL TO authenticated USING (public.get_current_user_role() IN ('admin', 'manager'));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    'worker'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_phases_updated_at BEFORE UPDATE ON public.project_phases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_materials_updated_at BEFORE UPDATE ON public.project_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_time_sheets_updated_at BEFORE UPDATE ON public.time_sheets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON public.checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_checklists_updated_at BEFORE UPDATE ON public.project_checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();