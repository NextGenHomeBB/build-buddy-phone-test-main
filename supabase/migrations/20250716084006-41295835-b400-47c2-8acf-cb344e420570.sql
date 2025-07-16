-- Fix existing placeholder profiles that weren't marked correctly
UPDATE profiles 
SET is_placeholder = true 
WHERE auth_user_id IS NULL 
  AND user_id NOT IN (
    SELECT id FROM auth.users WHERE id IS NOT NULL
  );

-- For the current authenticated user, link them to the "Jhon" placeholder
-- First, let's check who the current authenticated user is
DO $$
DECLARE
  current_user_id uuid;
  jhon_placeholder_id uuid := '3f6dcdb9-ec48-45b4-8b6c-97e0c86eb226';
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NOT NULL THEN
    -- Link the current user to the Jhon placeholder
    UPDATE profiles
    SET auth_user_id = current_user_id,
        is_placeholder = false,
        updated_at = now()
    WHERE user_id = jhon_placeholder_id;
    
    -- Also update any existing profile for this auth user to link to Jhon
    UPDATE profiles
    SET auth_user_id = jhon_placeholder_id,
        updated_at = now()
    WHERE user_id = current_user_id AND user_id != jhon_placeholder_id;
  END IF;
END $$;