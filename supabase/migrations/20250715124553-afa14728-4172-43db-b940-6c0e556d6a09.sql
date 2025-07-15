-- Auto-assign a checklist to the first project so user can see items in QuickAssignDrawer
INSERT INTO project_checklists (project_id, checklist_id, completed_items)
SELECT 
  '79d1b9ea-eafc-4320-bf96-be090138b44a' as project_id,
  c.id as checklist_id,
  '{}'::jsonb as completed_items
FROM checklists c 
WHERE c.is_template = true 
  AND c.name = 'Foundation Inspection'
LIMIT 1;