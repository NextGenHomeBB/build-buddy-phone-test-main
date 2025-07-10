-- Add material_cost and labour_cost fields to project_phases table
ALTER TABLE public.project_phases 
ADD COLUMN material_cost DECIMAL DEFAULT 0,
ADD COLUMN labour_cost DECIMAL DEFAULT 0;

-- Add validation trigger to ensure start_date <= end_date
CREATE OR REPLACE FUNCTION validate_phase_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL AND NEW.start_date > NEW.end_date THEN
    RAISE EXCEPTION 'Start date cannot be later than end date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_phase_dates
  BEFORE INSERT OR UPDATE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION validate_phase_dates();

-- Function to update project remaining budget when phase costs change
CREATE OR REPLACE FUNCTION update_project_budget_on_phase_change()
RETURNS TRIGGER AS $$
DECLARE
  old_total DECIMAL DEFAULT 0;
  new_total DECIMAL DEFAULT 0;
  cost_delta DECIMAL DEFAULT 0;
BEGIN
  -- Calculate old total cost
  IF TG_OP = 'UPDATE' THEN
    old_total := COALESCE(OLD.material_cost, 0) + COALESCE(OLD.labour_cost, 0);
  END IF;
  
  -- Calculate new total cost
  new_total := COALESCE(NEW.material_cost, 0) + COALESCE(NEW.labour_cost, 0);
  
  -- Calculate delta
  cost_delta := new_total - old_total;
  
  -- Update budget in project_phases (total_cost)
  NEW.budget := new_total;
  
  -- Update project's spent amount (assuming this reflects total phase costs)
  UPDATE projects 
  SET spent = spent + cost_delta,
      updated_at = now()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_budget_trigger
  BEFORE INSERT OR UPDATE ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION update_project_budget_on_phase_change();