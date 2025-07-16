-- Manually link the most recent profile to Jhon placeholder
-- Assuming the current user is the one that was recently created
UPDATE profiles 
SET auth_user_id = '28086ece-4d94-475d-a90b-f93073fb25d1',  -- This appears to be the current auth user from logs
    is_placeholder = false,
    updated_at = now()
WHERE user_id = '3f6dcdb9-ec48-45b4-8b6c-97e0c86eb226' AND name = 'Jhon';