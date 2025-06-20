import { supabase } from './supabase';

export const userService = {
  async list() {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, access_profile_id')
      .order('email');
    if (error) throw error;
    return data;
  },

  async create(user: { id?: string; name?: string; email: string; access_profile_id?: string }) {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<{ name: string; email: string; access_profile_id: string }>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};
