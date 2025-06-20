import { supabase } from './supabase';

export const accessPermissionService = {
  async listByProfile(profileId: string) {
    const { data, error } = await supabase
      .from('access_permissions')
      .select('permission')
      .eq('profile_id', profileId);
    if (error) throw error;
    return data?.map(p => p.permission) || [];
  },

  async setPermissions(profileId: string, permissions: string[]) {
    // Remove todas as permissões antigas
    const { error: delError } = await supabase
      .from('access_permissions')
      .delete()
      .eq('profile_id', profileId);
    if (delError) throw delError;
    // Insere as novas permissões
    if (permissions.length === 0) return true;
    const inserts = permissions.map(permission => ({ profile_id: profileId, permission }));
    const { error: insError } = await supabase
      .from('access_permissions')
      .insert(inserts);
    if (insError) throw insError;
    return true;
  }
};
