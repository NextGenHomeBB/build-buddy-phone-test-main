-- Add source tracking to projects and placeholder flag to profiles
ALTER TABLE public.projects 
ADD COLUMN source text DEFAULT 'manual';

ALTER TABLE public.profiles 
ADD COLUMN is_placeholder boolean DEFAULT false;

-- Update RLS policies to allow placeholder profile creation
CREATE POLICY "Managers and admins can create placeholder profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  is_placeholder = true AND 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('manager', 'admin')
  )
);