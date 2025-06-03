import { create } from 'zustand'
import { supabase } from '../services/supabase'

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
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
  checkUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    set({ user, loading: false })
  },
})) 