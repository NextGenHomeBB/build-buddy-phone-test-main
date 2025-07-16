-- Fix RLS policies for project_documents to allow project members to upload
DROP POLICY IF EXISTS "Managers can upload project documents" ON public.project_documents;

-- Create a more permissive upload policy for all project members
CREATE POLICY "Project members can upload documents" 
ON public.project_documents 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.user_project_role upr 
    WHERE upr.project_id = project_documents.project_id 
    AND upr.user_id = auth.uid()
  )
);

-- Also update delete policy to allow project members to delete their own uploads
DROP POLICY IF EXISTS "Managers can delete project documents" ON public.project_documents;

CREATE POLICY "Project members can delete their own documents" 
ON public.project_documents 
FOR DELETE 
USING (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM public.user_project_role upr 
    WHERE upr.project_id = project_documents.project_id 
    AND upr.user_id = auth.uid() 
    AND upr.role IN ('manager', 'admin')
  )
);