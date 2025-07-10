-- Create function to update remaining budget
CREATE OR REPLACE FUNCTION public.update_remaining_budget(
  project_id_param UUID,
  amount_delta NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.projects
  SET remaining_budget = remaining_budget + amount_delta,
      updated_at = now()
  WHERE id = project_id_param;
END;
$$;