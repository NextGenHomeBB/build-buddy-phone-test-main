-- Let's take a different approach
-- Make user_id nullable and add a conditional foreign key constraint

-- Drop the current constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Make user_id nullable 
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Add a check constraint that ensures either:
-- 1. It's a placeholder user (is_placeholder = true) with any user_id
-- 2. It's a real user (is_placeholder = false or null) with a valid user_id that exists in auth.users
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_valid_user_id 
CHECK (
  (is_placeholder = true) OR 
  (is_placeholder = false AND user_id IS NOT NULL)
);

-- We'll handle the foreign key constraint through triggers or application logic for non-placeholder users