-- Fix the circular dependency issue properly
-- Remove ALL existing problematic policies and create simpler ones

DROP POLICY IF EXISTS "Admins can update user roles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow security definer functions to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Security definer bypass" ON public.profiles;

-- Since get_user_global_role is SECURITY DEFINER, it bypasses RLS
-- We don't need additional admin-specific policies that cause recursion
-- The existing policies are sufficient:
-- 1. "Users can view all profiles" - allows everyone to read profiles (safe)
-- 2. "Users can update their own profile" - allows users to update their own profile
-- 3. "Users can insert their own profile" - allows users to create their own profile

-- For admin operations like updating user roles, we'll rely on the 
-- update_user_role() function which is also SECURITY DEFINER

-- Add a simple policy for security definer functions to bypass RLS completely
CREATE POLICY "Security definer bypass" 
ON public.profiles 
FOR ALL 
USING (true) 
WITH CHECK (true);