-- Create feedback table
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    project_id UUID REFERENCES public.projects(id),
    category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'ui', 'other')),
    title TEXT NOT NULL CHECK (char_length(title) <= 120),
    message TEXT NOT NULL,
    attachment_url TEXT,
    status TEXT NOT NULL DEFAULT 'open' 
        CHECK (status IN ('open', 'in_progress', 'resolved')),
    external_issue_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Insert policy - any authenticated user can submit feedback
CREATE POLICY "Authenticated users can insert feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Select policy - users can view their own feedback, admins can view all
CREATE POLICY "Users can view own feedback, admins view all"
ON public.feedback
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id 
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Update policy - users can update their own while open, admins can update any
CREATE POLICY "Users can update own open feedback, admins update any"
ON public.feedback
FOR UPDATE
TO authenticated
USING (
    (auth.uid() = user_id AND status = 'open') 
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Delete policy - admins only
CREATE POLICY "Only admins can delete feedback"
ON public.feedback
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Create trigger function for updating timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();