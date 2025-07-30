-- First, let's create the missing profile for the existing auth user
INSERT INTO public.profiles (
  id, 
  auth_user_id, 
  organization_id, 
  role, 
  full_name, 
  name,
  phone,
  company_name,
  is_placeholder
)
SELECT 
  au.id,
  au.id,
  current_org(),
  'worker',
  COALESCE(au.raw_user_meta_data->>'full_name', 'Worker User'),
  COALESCE(au.raw_user_meta_data->>'full_name', 'Worker User'),
  au.raw_user_meta_data->>'phone_number',
  au.raw_user_meta_data->>'company_name',
  false
FROM auth.users au 
WHERE au.email = 'raafatmasalmeh999@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.auth_user_id = au.id
);

-- Update the handle_new_user function to properly create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    auth_user_id, 
    organization_id, 
    role, 
    full_name, 
    name,
    phone,
    company_name,
    is_placeholder
  )
  VALUES (
    NEW.id,
    NEW.id,
    current_org(),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'worker'),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.raw_user_meta_data ->> 'company_name',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    auth_user_id = EXCLUDED.auth_user_id;
  
  RETURN NEW;
END;
$function$;