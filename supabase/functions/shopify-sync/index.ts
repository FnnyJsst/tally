// supabase/functions/shopify-sync/index.ts
// Tally — Sync automatique des commandes Shopify

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function fetchShopifyOrders(
  shop: string,
  accessToken: string,
  sinceId: string | null,
  updatedAtMin: string | null
): Promise<any[]> {
  const params = new URLSearchParams({
    status: 'any',
    fulfillment_status: 'fulfilled',
    limit: '250',
  })
  if (updatedAtMin) params.set('updated_at_min', updatedAtMin)
  if (sinceId) params.set('since_id', sinceId)

  const url = `https://${shop}/admin/api/2024-01/orders.json?${params.toString()}`

  const response = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': accessToken },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Shopify API error: ${response.status} — ${error}`)
  }

  const data = await response.json()
  return data.orders ?? []
}

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Récupère tous les canaux Shopify actifs
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id, user_id, shop_id, site_url, oauth_token, last_synced_at')
      .eq('type', 'shopify')
      .eq('is_active', true)
      .not('oauth_token', 'is', null)
      .not('site_url', 'is', null)

    if (channelsError) throw channelsError
    if (!channels || channels.length === 0) {
      return new Response(JSON.stringify({ message: 'No Shopify channels to sync' }), { status: 200 })
    }

    const results = []

    for (const channel of channels) {
      try {
        const updatedAtMin = channel.last_synced_at
          ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const orders = await fetchShopifyOrders(
          channel.site_url,
          channel.oauth_token,
          null,
          updatedAtMin
        )

        let itemsSynced = 0

        for (const order of orders) {
          for (const lineItem of order.line_items ?? []) {
            const sku = lineItem.sku

            // Cherche la variante par SKU
            const { data: variant } = await supabase
              .from('variants')
              .select('id, product_id, products!inner(user_id)')
              .eq('sku_suffix', sku)
              .eq('products.user_id', channel.user_id)
              .maybeSingle()

            if (!variant) continue

            // Idempotence : vérifie si ce mouvement existe déjà
            const noteKey = `shopify_order_${order.id}_item_${lineItem.id}`
            const { data: existing } = await supabase
              .from('stock_entries')
              .select('id')
              .eq('variant_id', variant.id)
              .eq('channel_id', channel.id)
              .eq('note', noteKey)
              .maybeSingle()

            if (existing) continue

            await supabase.from('stock_entries').insert({
              variant_id: variant.id,
              channel_id: channel.id,
              quantity: -lineItem.quantity,
              type: 'sale',
              note: noteKey,
              occurred_at: order.processed_at ?? order.created_at,
            })

            itemsSynced++
          }
        }

        await supabase
          .from('channels')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', channel.id)

        await supabase.from('sync_logs').insert({
          channel_id: channel.id,
          status: 'ok',
          items_synced: itemsSynced,
        })

        results.push({ channelId: channel.id, itemsSynced, status: 'ok' })

      } catch (err: any) {
        await supabase.from('sync_logs').insert({
          channel_id: channel.id,
          status: 'error',
          error_message: err.message,
        })
        results.push({ channelId: channel.id, status: 'error', error: err.message })
      }
    }

    return new Response(JSON.stringify({ synced: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
