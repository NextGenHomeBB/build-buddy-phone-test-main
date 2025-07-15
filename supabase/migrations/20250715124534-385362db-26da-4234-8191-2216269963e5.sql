-- Insert some default checklist templates
INSERT INTO checklists (name, description, items, is_template) VALUES 
(
  'Foundation Inspection',
  'Comprehensive foundation quality checklist',
  '[
    {"id": "item-1", "title": "Verify concrete mix specifications"},
    {"id": "item-2", "title": "Check rebar placement and spacing"},
    {"id": "item-3", "title": "Inspect formwork alignment"},
    {"id": "item-4", "title": "Test concrete slump"},
    {"id": "item-5", "title": "Document foundation dimensions"}
  ]'::jsonb,
  true
),
(
  'Electrical Safety',
  'Electrical work safety and compliance checklist',
  '[
    {"id": "item-1", "title": "Power isolation confirmed"},
    {"id": "item-2", "title": "Circuit testing completed"},
    {"id": "item-3", "title": "Ground fault protection verified"},
    {"id": "item-4", "title": "Panel labeling updated"},
    {"id": "item-5", "title": "Safety equipment inspected"}
  ]'::jsonb,
  true
),
(
  'Final Walkthrough',
  'Pre-delivery quality assurance checklist',
  '[
    {"id": "item-1", "title": "All fixtures installed and working"},
    {"id": "item-2", "title": "Paint touchups completed"},
    {"id": "item-3", "title": "Flooring installation verified"},
    {"id": "item-4", "title": "HVAC system tested"},
    {"id": "item-5", "title": "Customer documentation prepared"}
  ]'::jsonb,
  true
);