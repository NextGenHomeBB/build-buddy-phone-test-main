-- Add missing foreign key constraint between schedule_item_workers and profiles
ALTER TABLE public.schedule_item_workers 
ADD CONSTRAINT fk_schedule_item_workers_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;