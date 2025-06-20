import { supabase } from './supabase';

export const accessProfileService = {
  async list() {
    const { data, error } = await supabase
      .from('access_profiles')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  async create(profile) {
    const { data, error } = await supabase
      .from('access_profiles')
      .insert([profile])
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('access_profiles')
      .update(updates)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase
      .from('access_profiles')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};
