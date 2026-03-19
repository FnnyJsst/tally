import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Channel } from '../types/types'

type ChannelStore = {
  channels: Channel[]
  isLoading: boolean

  fetchChannels: () => Promise<void>
  createChannel: (data: Partial<Channel>) => Promise<{ error: string | null }>
  updateChannel: (id: string, data: Partial<Channel>) => Promise<{ error: string | null }>
  deleteChannel: (id: string) => Promise<void>
}

export const useChannelStore = create<ChannelStore>((set, get) => ({
  channels: [],
  isLoading: false,

  fetchChannels: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (!error && data) set({ channels: data })
    set({ isLoading: false })
  },

  createChannel: async (data) => {
    const { error } = await supabase.from('channels').insert(data)
    if (error) return { error: error.message }
    await get().fetchChannels()
    return { error: null }
  },

  updateChannel: async (id, data) => {
    const { error } = await supabase.from('channels').update(data).eq('id', id)
    if (error) return { error: error.message }
    await get().fetchChannels()
    return { error: null }
  },

  deleteChannel: async (id) => {
    await supabase.from('channels').update({ is_active: false }).eq('id', id)
    set((state) => ({ channels: state.channels.filter((c) => c.id !== id) }))
  },
}))
