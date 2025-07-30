-- Update raafatmasalmeh987@gmail.com to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'raafatmasalmeh987@gmail.com'
);

-- Also ensure both users are in the same organization (using default org)
UPDATE public.profiles 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('raafatmasalmeh987@gmail.com', 'the.infinite.reel7@gmail.com')
);

-- Update the handle_new_user function to make first user admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  org_id uuid;
  user_role text;
  default_org_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  user_count integer;
BEGIN
  -- Try to get organization_id and role from JWT claims
  org_id := (NEW.raw_user_meta_data ->> 'organization_id')::uuid;
  user_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'worker');
  
  -- If no organization in JWT, use current_org() or default
  IF org_id IS NULL THEN
    org_id := current_org();
    -- Final fallback to default organization
    IF org_id IS NULL THEN
      org_id := default_org_id;
    END IF;
  END IF;

  -- Check if this is the first user (make them admin)
  SELECT COUNT(*) INTO user_count FROM public.profiles WHERE organization_id = org_id;
  
  IF user_count = 0 THEN
    user_role := 'admin';
  END IF;

  -- Log for debugging
  RAISE LOG 'Creating profile for user % with org_id % and role %', NEW.id, org_id, user_role;

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
    org_id,
    user_role,
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
    auth_user_id = EXCLUDED.auth_user_id,
    organization_id = COALESCE(EXCLUDED.organization_id, profiles.organization_id),
    role = COALESCE(EXCLUDED.role, profiles.role);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$function$;