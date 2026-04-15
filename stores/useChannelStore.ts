import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Channel } from '../types/types'

type ChannelStore = {
  channels: Channel[]
  isLoading: boolean
  syncingChannelIds: string[]

  fetchChannels: () => Promise<void>
  createChannel: (data: Partial<Channel>) => Promise<{ error: string | null }>
  updateChannel: (id: string, data: Partial<Channel>) => Promise<{ error: string | null }>
  deleteChannel: (id: string) => Promise<void>
  syncChannel: (channel: Channel) => Promise<{ error: string | null }>
}

const SYNC_FUNCTION: Partial<Record<Channel['type'], string>> = {
  woocommerce: 'woo-sync',
  etsy: 'etsy-sync',
  shopify: 'shopify-sync',
}

export const useChannelStore = create<ChannelStore>((set, get) => ({
  channels: [],
  isLoading: false,
  syncingChannelIds: [],

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

  syncChannel: async (channel) => {
    const fn = SYNC_FUNCTION[channel.type]
    if (!fn) return { error: 'Ce type de canal ne supporte pas la sync automatique.' }

    set((state) => ({ syncingChannelIds: [...state.syncingChannelIds, channel.id] }))
    try {
      const { error } = await supabase.functions.invoke(fn, {
        body: { channelId: channel.id },
      })
      if (error) return { error: error.message }
      await get().fetchChannels()
      return { error: null }
    } finally {
      set((state) => ({ syncingChannelIds: state.syncingChannelIds.filter((id) => id !== channel.id) }))
    }
  },
}))
