-- Create the missing trigger to automatically create profiles when users sign up
-- This trigger was missing, which is why signup was failing

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();