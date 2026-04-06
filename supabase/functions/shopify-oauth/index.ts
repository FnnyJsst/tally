import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SHOPIFY_CLIENT_ID = Deno.env.get('SHOPIFY_API_KEY')!
const SHOPIFY_CLIENT_SECRET = Deno.env.get('SHOPIFY_API_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/shopify-oauth`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  console.log('shopify-oauth called, method:', req.method, 'path:', url.pathname)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // ─── CALLBACK GET de Shopify ─────────────────────────────
  // Shopify redirige ici après autorisation : GET ?code=...&state=...&shop=...
  if (req.method === 'GET') {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const shop = url.searchParams.get('shop')

    if (!code || !state || !shop) {
      return new Response('Paramètres manquants', { status: 400 })
    }

    try {
      // Retrouve le canal via le state stocké
      const { data: channel } = await supabase
        .from('channels')
        .select('id, api_token')
        .eq('api_token', state)
        .eq('type', 'shopify')
        .single()

      if (!channel) {
        return new Response('State invalide ou expiré', { status: 400 })
      }

      // Échange le code contre l'access token
      const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: SHOPIFY_CLIENT_ID,
          client_secret: SHOPIFY_CLIENT_SECRET,
          code,
        }),
      })

      const tokenData = await tokenResponse.json()
      if (!tokenResponse.ok || !tokenData.access_token) {
        console.error('Token error:', tokenData)
        return new Response('Erreur token Shopify', { status: 500 })
      }

      // Récupère les infos de la boutique
      const shopRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: { 'X-Shopify-Access-Token': tokenData.access_token },
      })
      const shopData = await shopRes.json()
      const shopId = shopData.shop?.id?.toString() ?? null
      const shopName = shopData.shop?.name ?? shop

      // Sauvegarde et active le canal
      await supabase.from('channels').update({
        oauth_token: tokenData.access_token,
        api_token: null,
        shop_id: shopId,
        name: shopName,
        site_url: shop,
        is_active: true,
        last_synced_at: null,
      }).eq('id', channel.id)

      console.log('Shopify channel activated:', shopName)

      // Redirige vers l'app mobile via deep link
      return new Response(null, {
        status: 302,
        headers: { Location: `tally://oauth/shopify?success=true&shop=${shop}` },
      })

    } catch (err: any) {
      console.error('Callback error:', err.message)
      return new Response('Erreur serveur', { status: 500 })
    }
  }

  // ─── APPELS POST depuis l'app ────────────────────────────
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      console.log('action:', body.action)

      // Génère l'URL d'autorisation Shopify
      if (body.action === 'auth_url') {
        const { shop, channel_id } = body

        const state = crypto.randomUUID()

        await supabase.from('channels').update({
          api_token: state,
        }).eq('id', channel_id)

        const params = new URLSearchParams({
          client_id: SHOPIFY_CLIENT_ID,
          scope: 'read_orders,read_products',
          redirect_uri: FUNCTION_URL,
          state,
        })

        const authUrl = `https://${shop}/admin/oauth/authorize?${params.toString()}`
        console.log('Auth URL generated for:', shop)

        return json({ auth_url: authUrl })
      }

      return json({ error: 'Unknown action' }, 400)

    } catch (err: any) {
      console.error('Error:', err.message)
      return json({ error: err.message }, 500)
    }
  }

  return json({ error: 'Method not allowed' }, 405)
})
