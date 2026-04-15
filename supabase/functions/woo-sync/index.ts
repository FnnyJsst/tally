// supabase/functions/woo-sync/index.ts
// Tally — Sync automatique des commandes WooCommerce
// Tourne en cron toutes les heures

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ─── Fetch commandes WooCommerce ──────────────────────────
async function fetchWooOrders(
  siteUrl: string,
  apiKey: string,
  after: string
): Promise<any[]> {
  // L'api_token est stocké sous la forme "ck_xxx:cs_xxx"
  const [consumerKey, consumerSecret] = apiKey.split(':')
  const credentials = btoa(`${consumerKey}:${consumerSecret}`)

  const url = `${siteUrl.replace(/\/$/, '')}/wp-json/wc/v3/orders?status=completed&after=${after}&per_page=100&orderby=date&order=asc`

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`WooCommerce API error: ${response.status} — ${error}`)
  }

  return await response.json()
}

// ─── Handler principal ─────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // channelId optionnel : si fourni, sync uniquement ce canal (trigger manuel)
    const body = await req.json().catch(() => ({}))
    const specificChannelId: string | undefined = body?.channelId

    let query = supabase
      .from('channels')
      .select('id, user_id, name, api_token, site_url, last_synced_at')
      .eq('type', 'woocommerce')
      .eq('is_active', true)
      .not('api_token', 'is', null)

    if (specificChannelId) {
      query = query.eq('id', specificChannelId)
    }

    const { data: channels, error: channelsError } = await query

    if (channelsError) throw channelsError
    if (!channels || channels.length === 0) {
      return new Response(JSON.stringify({ message: 'No WooCommerce channels to sync' }), { status: 200 })
    }

    const results = []

    for (const channel of channels) {
      try {
        // Depuis la dernière sync ou 24h par défaut
        const after = channel.last_synced_at
          ? new Date(channel.last_synced_at).toISOString()
          : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const siteUrl = channel.site_url ?? channel.name
        const orders = await fetchWooOrders(siteUrl, channel.api_token, after)

        let itemsSynced = 0

        for (const order of orders) {
          for (const item of order.line_items ?? []) {
            const sku = item.sku

            if (!sku) continue

            // Cherche la variante par SKU
            const { data: variant } = await supabase
              .from('variants')
              .select('id, products!inner(user_id)')
              .eq('sku_suffix', sku)
              .eq('products.user_id', channel.user_id)
              .maybeSingle()

            if (!variant) continue

            // Idempotence : vérifie si ce mouvement existe déjà
            const noteKey = `woo_order_${order.id}_item_${item.id}`
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
              quantity: -item.quantity, // négatif = vente
              type: 'sale',
              note: noteKey,
              occurred_at: order.date_completed ?? order.date_created,
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
