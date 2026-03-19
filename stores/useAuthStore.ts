import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '../types/types'

type AuthStore = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  signIn: async (email, password) => {
    set({ isLoading: true })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    set({ isLoading: false })
    if (error) return { error: error.message }
    set({ isAuthenticated: true })
    return { error: null }
  },

  signUp: async (email, password) => {
    set({ isLoading: true })
    const { error } = await supabase.auth.signUp({ email, password })
    set({ isLoading: false })
    if (error) return { error: error.message }
    return { error: null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false })
  },

  fetchUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) set({ user: data, isAuthenticated: true })
  },
}))
