import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Product, Variant } from '../types/types'

type ProductStore = {
  products: Product[]
  isLoading: boolean
  selectedProduct: Product | null

  fetchProducts: () => Promise<void>
  fetchProduct: (id: string) => Promise<void>
  createProduct: (data: Partial<Product>) => Promise<{ error: string | null }>
  updateProduct: (id: string, data: Partial<Product>) => Promise<{ error: string | null }>
  deleteProduct: (id: string) => Promise<void>
  setSelectedProduct: (product: Product | null) => void
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  isLoading: false,
  selectedProduct: null,

  fetchProducts: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('products')
      .select(`*, variants(*)`)
      .order('created_at', { ascending: false })

    if (!error && data) {
      // Calcul du stock total par produit (somme des mouvements)
      const withStock = await Promise.all(
        data.map(async (product) => {
          const { data: entries } = await supabase
            .from('stock_entries')
            .select('quantity, variant_id')
            .in('variant_id', product.variants?.map((v: Variant) => v.id) ?? [])

          const totalStock = entries?.reduce((sum, e) => sum + e.quantity, 0) ?? 0
          return { ...product, totalStock }
        })
      )
      set({ products: withStock })
    }
    set({ isLoading: false })
  },

  fetchProduct: async (id) => {
    const { data } = await supabase
      .from('products')
      .select(`*, variants(*)`)
      .eq('id', id)
      .single()

    if (data) set({ selectedProduct: data })
  },

  createProduct: async (data) => {
    const { error } = await supabase.from('products').insert(data)
    if (error) return { error: error.message }
    await get().fetchProducts()
    return { error: null }
  },

  updateProduct: async (id, data) => {
    const { error } = await supabase.from('products').update(data).eq('id', id)
    if (error) return { error: error.message }
    await get().fetchProducts()
    return { error: null }
  },

  deleteProduct: async (id) => {
    await supabase.from('products').delete().eq('id', id)
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }))
  },

  setSelectedProduct: (product) => set({ selectedProduct: product }),
}))
