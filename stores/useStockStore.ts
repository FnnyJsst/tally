import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { StockEntry, MovementType } from '../types/types'

type StockStore = {
  entries: StockEntry[]
  isLoading: boolean

  fetchEntries: (limit?: number) => Promise<void>
  addMovement: (data: {
    variantId: string
    channelId: string
    quantity: number
    type: MovementType
    note?: string
    occurredAt?: string
  }) => Promise<{ error: string | null }>
  getStockForVariant: (variantId: string) => number
}

export const useStockStore = create<StockStore>((set, get) => ({
  entries: [],
  isLoading: false,

  fetchEntries: async (limit = 50) => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('stock_entries')
      .select(`*, variants(name, product_id, products(name)), channels(name, type)`)
      .order('occurred_at', { ascending: false })
      .limit(limit)

    if (!error && data) set({ entries: data })
    set({ isLoading: false })
  },

  addMovement: async ({ variantId, channelId, quantity, type, note, occurredAt }) => {
    // Les ventes, transferts et pertes sont négatifs
    const signedQty = ['sale', 'transfer', 'loss'].includes(type)
      ? -Math.abs(quantity)
      : Math.abs(quantity)

    const { error } = await supabase.from('stock_entries').insert({
      variant_id: variantId,
      channel_id: channelId,
      quantity: signedQty,
      type,
      note,
      occurred_at: occurredAt ?? new Date().toISOString(),
    })

    if (error) return { error: error.message }
    await get().fetchEntries()
    return { error: null }
  },

  // Calcule le stock actuel d'une variante depuis les entrées en mémoire
  getStockForVariant: (variantId) => {
    return get().entries
      .filter((e) => e.variantId === variantId)
      .reduce((sum, e) => sum + e.quantity, 0)
  },
}))
