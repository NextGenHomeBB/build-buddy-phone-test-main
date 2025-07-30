-- Update RLS policy to allow managers to assign tasks
DROP POLICY IF EXISTS "TaskWorkers: admin manage" ON task_workers;

-- Create new policy that allows admins and managers to assign tasks
CREATE POLICY "TaskWorkers: admin and manager manage" 
ON task_workers 
FOR ALL
USING (
  organization_id = current_org() AND 
  (get_current_user_role() = 'admin' OR get_current_user_role() = 'manager')
);

-- Create policy for users to see their own assignments
CREATE POLICY "TaskWorkers: users view own assignments" 
ON task_workers 
FOR SELECT
USING (
  organization_id = current_org() AND 
  (user_id = auth.uid() OR get_current_user_role() = 'admin' OR get_current_user_role() = 'manager')
);