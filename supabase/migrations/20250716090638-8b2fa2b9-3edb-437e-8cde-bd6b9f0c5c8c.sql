-- Add foreign key constraint between task_workers and profiles
ALTER TABLE public.task_workers 
ADD CONSTRAINT fk_task_workers_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles (user_id) 
ON DELETE CASCADE;