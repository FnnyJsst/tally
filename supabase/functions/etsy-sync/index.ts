// supabase/functions/etsy-sync/index.ts
// Tally — Sync automatique des commandes Etsy
// Tourne en cron toutes les heures

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hmac } from 'https://esm.sh/@noble/hashes@1.3.2/hmac'
import { sha1 } from 'https://esm.sh/@noble/hashes@1.3.2/sha1'
import { encode as encodeBase64 } from 'https://deno.land/std@0.208.0/encoding/base64.ts'

const ETSY_API_BASE = 'https://openapi.etsy.com/v3'
const ETSY_API_KEY = Deno.env.get('ETSY_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ─── OAuth 1.0 helper ────────────────────────────────────
function generateOAuthHeader(
  method: string,
  url: string,
  oauthToken: string,
  oauthTokenSecret: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: ETSY_API_KEY,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: oauthToken,
    oauth_version: '1.0',
  }

  // Signature base string
  const sortedParams = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&')

  // Signing key
  const signingKey = `${encodeURIComponent(Deno.env.get('ETSY_SHARED_SECRET')!)}&${encodeURIComponent(oauthTokenSecret)}`

  // HMAC-SHA1
  const signature = encodeBase64(
    hmac(sha1, new TextEncoder().encode(signingKey), new TextEncoder().encode(baseString))
  )

  oauthParams.oauth_signature = signature

  const headerValue = Object.entries(oauthParams)
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ')

  return `OAuth ${headerValue}`
}

// ─── Fetch commandes Etsy ─────────────────────────────────
async function fetchEtsyReceipts(
  shopId: string,
  oauthToken: string,
  oauthTokenSecret: string,
  minCreated: number
): Promise<any[]> {
  const url = `${ETSY_API_BASE}/application/shops/${shopId}/receipts?min_created=${minCreated}&limit=100&was_paid=true`

  const authHeader = generateOAuthHeader('GET', url.split('?')[0], oauthToken, oauthTokenSecret)

  const response = await fetch(url, {
    headers: {
      Authorization: authHeader,
      'x-api-key': ETSY_API_KEY,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Etsy API error: ${response.status} — ${error}`)
  }

  const data = await response.json()
  return data.results ?? []
}

// ─── Handler principal ────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Récupère tous les canaux Etsy actifs avec leurs tokens
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id, user_id, shop_id, oauth_token, oauth_token_secret, last_synced_at')
      .eq('type', 'etsy')
      .eq('is_active', true)
      .not('oauth_token', 'is', null)
      .not('shop_id', 'is', null)

    if (channelsError) throw channelsError
    if (!channels || channels.length === 0) {
      return new Response(JSON.stringify({ message: 'No Etsy channels to sync' }), { status: 200 })
    }

    const results = []

    for (const channel of channels) {
      try {
        // Depuis la dernière sync ou 24h par défaut
        const minCreated = channel.last_synced_at
          ? Math.floor(new Date(channel.last_synced_at).getTime() / 1000)
          : Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000)

        const receipts = await fetchEtsyReceipts(
          channel.shop_id,
          channel.oauth_token,
          channel.oauth_token_secret,
          minCreated
        )

        let itemsSynced = 0

        for (const receipt of receipts) {
          for (const transaction of receipt.transactions ?? []) {
            // Cherche la variante par SKU
            const sku = transaction.sku || transaction.listing_id?.toString()

            const { data: variant } = await supabase
              .from('variants')
              .select('id, product_id, products!inner(user_id)')
              .eq('sku_suffix', sku)
              .eq('products.user_id', channel.user_id)
              .maybeSingle()

            if (!variant) continue

            // Vérifie si ce mouvement existe déjà (idempotence)
            const { data: existing } = await supabase
              .from('stock_entries')
              .select('id')
              .eq('variant_id', variant.id)
              .eq('channel_id', channel.id)
              .eq('note', `etsy_receipt_${receipt.receipt_id}_${transaction.transaction_id}`)
              .maybeSingle()

            if (existing) continue

            // Crée le mouvement de stock
            await supabase.from('stock_entries').insert({
              variant_id: variant.id,
              channel_id: channel.id,
              quantity: -transaction.quantity, // négatif = vente
              type: 'sale',
              note: `etsy_receipt_${receipt.receipt_id}_${transaction.transaction_id}`,
              occurred_at: new Date(receipt.created_timestamp * 1000).toISOString(),
            })

            itemsSynced++
          }
        }

        // Met à jour last_synced_at et log
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
        // Log l'erreur mais continue avec les autres canaux
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
