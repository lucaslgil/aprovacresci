import { supabase } from './supabase';

export const userService = {
  async list() {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, access_profile_id')
      .order('name');
    if (error) throw error;
    return data;
  },

  async create(user) {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};
