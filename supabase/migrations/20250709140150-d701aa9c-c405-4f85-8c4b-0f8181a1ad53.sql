-- Drop existing policy if it exists
DROP POLICY IF EXISTS "project_read_worker_task" ON public.projects;

-- Allow project read if user has explicit role OR owns a task
CREATE POLICY "project_read_worker_task"
ON public.projects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_project_role upr
    WHERE upr.user_id = auth.uid()
      AND upr.project_id = projects.id
  )
  OR EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.project_id = projects.id
      AND t.assigned_to = auth.uid()
  )
);