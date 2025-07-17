-- Create storage policies for project documents viewing
CREATE POLICY "Users can view project documents for assigned projects" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'project-documents' 
  AND EXISTS (
    SELECT 1 
    FROM user_project_role upr
    JOIN project_documents pd ON pd.project_id = upr.project_id
    WHERE pd.file_path = storage.objects.name 
    AND upr.user_id = auth.uid()
  )
);

-- Allow users to view files in project-documents bucket if they have project access
CREATE POLICY "Project members can view document files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1 
    FROM project_documents pd
    JOIN user_project_role upr ON upr.project_id = pd.project_id
    WHERE pd.file_path = storage.objects.name
    AND upr.user_id = auth.uid()
  )
);