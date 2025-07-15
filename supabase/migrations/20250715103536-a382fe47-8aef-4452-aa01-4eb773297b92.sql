-- Create function_errors table for audit logging
CREATE TABLE IF NOT EXISTS public.function_errors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fn text NOT NULL,
  detail jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.function_errors ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all function errors
CREATE POLICY "Admins can view function errors" 
ON public.function_errors 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Allow the edge function to insert errors (service role)
CREATE POLICY "Service role can insert function errors" 
ON public.function_errors 
FOR INSERT 
WITH CHECK (true);