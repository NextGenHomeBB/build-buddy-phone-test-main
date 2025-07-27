-- Create user_material_favorites table
CREATE TABLE public.user_material_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  material_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, material_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_material_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own favorites" 
ON public.user_material_favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites" 
ON public.user_material_favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" 
ON public.user_material_favorites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add foreign key reference to materials table
ALTER TABLE public.user_material_favorites 
ADD CONSTRAINT fk_material_favorites_material 
FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;