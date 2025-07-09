import { supabase } from '@/integrations/supabase/client';

export async function upsertUserProjectRole(
  userId: string,
  projectId: string,
  role: 'manager' | 'worker' = 'worker'
) {
  const { data, error } = await supabase
    .from('user_project_role')
    .upsert({ user_id: userId, project_id: projectId, role })
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}