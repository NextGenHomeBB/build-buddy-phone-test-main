import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  role: 'admin' | 'manager' | 'worker' | 'viewer';
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const userService = {
  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as UserProfile[];
  },

  async createUser(userData: {
    name: string;
    email: string;
    role: UserProfile['role'];
  }) {
    // Use the new placeholder user function
    const { data, error } = await supabase
      .rpc('create_placeholder_user', {
        user_name: userData.name,
        user_email: userData.email,
        user_role: userData.role
      });
    
    if (error) throw error;
    return data;
  },

  async updateUserRole(userId: string, newRole: UserProfile['role']) {
    const { data, error } = await supabase
      .rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });
    
    if (error) throw error;
    return data;
  },

  async getUserStats() {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('role');
    
    if (error) throw error;
    
    const stats = {
      total: users.length,
      active: users.length, // All users in profiles are considered active
      pending: 0, // We don't have a pending status in this schema
      admins: users.filter(u => u.role === 'admin').length,
      managers: users.filter(u => u.role === 'manager').length,
      workers: users.filter(u => u.role === 'worker').length,
    };
    
    return stats;
  }
};