-- Recreate missing checklist items for existing tasks
-- Using basic checklist items for construction tasks

INSERT INTO checklist_items (task_id, title, description, is_done, assignee_id)
SELECT 
  t.id as task_id,
  'Quality check completed' as title,
  'Verify all work meets quality standards' as description,
  false as is_done,
  null::uuid as assignee_id
FROM tasks t
WHERE NOT EXISTS (
  SELECT 1 FROM checklist_items ci WHERE ci.task_id = t.id
)

UNION ALL

SELECT 
  t.id as task_id,
  'Tools and materials cleaned up' as title,
  'Ensure work area is clean and organized' as description,
  false as is_done,
  null::uuid as assignee_id
FROM tasks t
WHERE NOT EXISTS (
  SELECT 1 FROM checklist_items ci WHERE ci.task_id = t.id
)

UNION ALL

SELECT 
  t.id as task_id,
  'Documentation completed' as title,
  'All required documentation and photos taken' as description,
  false as is_done,
  null::uuid as assignee_id
FROM tasks t
WHERE NOT EXISTS (
  SELECT 1 FROM checklist_items ci WHERE ci.task_id = t.id
);