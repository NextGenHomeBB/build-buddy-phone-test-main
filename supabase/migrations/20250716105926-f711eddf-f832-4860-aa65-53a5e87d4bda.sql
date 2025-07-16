-- Fix the profile linking for the current user
-- Link the "Jhon" placeholder profile to the currently authenticated user

UPDATE profiles 
SET auth_user_id = '28086ece-4d94-475d-a90b-f93073fb25d1',
    is_placeholder = false,
    updated_at = now()
WHERE user_id = '3f6dcdb9-ec48-45b4-8b6c-97e0c86eb226' 
  AND name = 'Jhon'
  AND is_placeholder = true;