-- Create missing profile for the admin user
INSERT INTO public.profiles (user_id, name, role)
VALUES ('28086ece-4d94-475d-a90b-f930731fb25d', 'Raafat', 'admin')
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;