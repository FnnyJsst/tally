// ─── Auth ───────────────────────────────────────────────
export type User = {
  id: string
  email: string
  shopName: string
  activityType: string
  createdAt: string
}

// ─── Produits ────────────────────────────────────────────
export type Product = {
  id: string
  userId: string
  name: string
  sku: string
  category: string
  hasVariants: boolean
  lowStockThreshold: number
  photoUrl?: string
  createdAt: string
  // Calculé côté client
  totalStock?: number
  variants?: Variant[]
}

export type Variant = {
  id: string
  productId: string
  name: string
  skuSuffix: string
  photoUrl?: string
  createdAt: string
  // Calculé côté client
  stock?: number
}

// ─── Canaux ──────────────────────────────────────────────
export type ChannelType = 'etsy' | 'woocommerce' | 'physical' | 'market' | 'other'

export type Channel = {
  id: string
  userId: string
  name: string
  type: ChannelType
  apiToken?: string
  lastSyncedAt?: string
  isActive: boolean
  createdAt: string
}

// ─── Mouvements de stock ─────────────────────────────────
export type MovementType = 'sale' | 'restock' | 'adjustment' | 'transfer' | 'loss'

export type StockEntry = {
  id: string
  variantId: string
  channelId: string
  quantity: number      // positif = entrée, négatif = sortie
  type: MovementType
  note?: string
  occurredAt: string
  createdAt: string
  // Joints côté client
  variant?: Variant
  channel?: Channel
}

// ─── Sync logs ───────────────────────────────────────────
export type SyncLog = {
  id: string
  channelId: string
  status: 'ok' | 'error'
  itemsSynced?: number
  errorMessage?: string
  createdAt: string
}

// ─── Navigation ──────────────────────────────────────────
export type RootStackParamList = {
  '(auth)': undefined
  '(tabs)': undefined
}
