-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', false);

-- Create project_documents table
CREATE TABLE public.project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for project documents
CREATE POLICY "Users can view project documents for assigned projects" 
ON public.project_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_project_role upr 
    WHERE upr.project_id = project_documents.project_id 
    AND upr.user_id = auth.uid()
  )
);

CREATE POLICY "Managers can upload project documents" 
ON public.project_documents 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.user_project_role upr 
    WHERE upr.project_id = project_documents.project_id 
    AND upr.user_id = auth.uid() 
    AND upr.role IN ('manager', 'admin')
  )
);

CREATE POLICY "Managers can delete project documents" 
ON public.project_documents 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_project_role upr 
    WHERE upr.project_id = project_documents.project_id 
    AND upr.user_id = auth.uid() 
    AND upr.role IN ('manager', 'admin')
  )
);

-- Create storage policies for project documents
CREATE POLICY "Users can view project documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'project-documents' AND
  EXISTS (
    SELECT 1 FROM public.project_documents pd
    JOIN public.user_project_role upr ON upr.project_id = pd.project_id
    WHERE pd.file_path = name AND upr.user_id = auth.uid()
  )
);

CREATE POLICY "Managers can upload project documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'project-documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Managers can delete project documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'project-documents' AND
  auth.uid() IS NOT NULL
);

-- Add trigger for updated_at
CREATE TRIGGER update_project_documents_updated_at
BEFORE UPDATE ON public.project_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();