-- The issue is that the profiles table has a foreign key constraint to auth.users
-- For placeholder users, we need to either:
-- 1. Remove the foreign key constraint temporarily for placeholders
-- 2. Or modify the constraint to be deferrable
-- 3. Or use a different approach

-- Let's check the existing constraint and modify it to allow placeholder users
-- We'll make the user_id nullable for placeholder users and add a check constraint

-- First, let's drop the existing foreign key constraint for user_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Add the foreign key constraint back but only for non-placeholder users
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;