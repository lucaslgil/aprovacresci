import { create } from 'zustand'
import { supabase } from '../services/supabase'
import { usePermissionsStore } from './permissions'

type User = {
  id: string
  email: string
}

type AuthStore = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    set({ user: data.user })
    // Buscar permissões do perfil
    if (data.user) {
      const { data: userRow } = await supabase
        .from('users')
        .select('access_profile_id')
        .eq('id', data.user.id)
        .single();
      if (userRow?.access_profile_id) {
        const { data: permissions } = await supabase
          .from('access_permissions')
          .select('permission')
          .eq('profile_id', userRow.access_profile_id);
        usePermissionsStore.getState().setPermissions(
          permissions ? permissions.map((p: any) => p.permission) : []
        );
      } else {
        usePermissionsStore.getState().setPermissions([]);
      }
    }
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
    usePermissionsStore.getState().clearPermissions();
  },
  checkUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    set({ user, loading: false })
    // Buscar permissões do perfil ao carregar
    if (user) {
      const { data: userRow } = await supabase
        .from('users')
        .select('access_profile_id')
        .eq('id', user.id)
        .single();
      if (userRow?.access_profile_id) {
        const { data: permissions } = await supabase
          .from('access_permissions')
          .select('permission')
          .eq('profile_id', userRow.access_profile_id);
        usePermissionsStore.getState().setPermissions(
          permissions ? permissions.map((p: any) => p.permission) : []
        );
      } else {
        usePermissionsStore.getState().setPermissions([]);
      }
    } else {
      usePermissionsStore.getState().clearPermissions();
    }
  },
}))