import { supabase } from '@/integrations/supabase/client';

export interface InviteCode {
  id: string;
  organization_id: string;
  code: string;
  created_by: string;
  expires_at?: string;
  max_uses?: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const inviteCodesService = {
  async getOrganizationCodes(organizationId: string): Promise<InviteCode[]> {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async generateCode(options: {
    expires_at?: string;
    max_uses?: number;
  } = {}): Promise<InviteCode> {
    // Get current user and organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    // Generate unique code
    const { data: codeResult, error: codeError } = await supabase
      .rpc('generate_invite_code');

    if (codeError) throw codeError;

    // Create invite code record
    const { data, error } = await supabase
      .from('invite_codes')
      .insert({
        organization_id: profile.organization_id,
        code: codeResult,
        created_by: user.id,
        expires_at: options.expires_at,
        max_uses: options.max_uses,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async validateCode(code: string): Promise<{
    valid: boolean;
    organization?: { id: string; name: string };
    error?: string;
  }> {
    // First get the invite code
    const { data: inviteCode, error: inviteError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (inviteError || !inviteCode) {
      return { valid: false, error: 'Invalid invite code' };
    }

    // Check expiration
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return { valid: false, error: 'Invite code has expired' };
    }

    // Check usage limit
    if (inviteCode.max_uses && inviteCode.current_uses >= inviteCode.max_uses) {
      return { valid: false, error: 'Invite code has reached its usage limit' };
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', inviteCode.organization_id)
      .single();

    if (orgError || !organization) {
      return { valid: false, error: 'Organization not found' };
    }

    return {
      valid: true,
      organization
    };
  },

  async useCode(code: string, userId: string): Promise<void> {
    // First get current usage count
    const { data: currentCode, error: fetchError } = await supabase
      .from('invite_codes')
      .select('current_uses')
      .eq('code', code.toUpperCase())
      .single();

    if (fetchError || !currentCode) throw new Error('Code not found');

    // Increment usage count
    const { error } = await supabase
      .from('invite_codes')
      .update({ 
        current_uses: currentCode.current_uses + 1
      })
      .eq('code', code.toUpperCase());

    if (error) throw error;
  },

  async deactivateCode(codeId: string): Promise<void> {
    const { error } = await supabase
      .from('invite_codes')
      .update({ is_active: false })
      .eq('id', codeId);

    if (error) throw error;
  }
};