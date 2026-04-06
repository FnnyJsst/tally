import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ETSY_CLIENT_ID = Deno.env.get('ETSY_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Génère un code verifier PKCE
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Génère le code challenge depuis le verifier
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('etsy-oauth v3 called')

  try {
    const body = await req.json()
    console.log('action:', body.action)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // ─── ÉTAPE 1 : Génère l'URL d'autorisation ───────────
    if (body.action === 'auth_url') {
      const { channel_id, callback_url } = body

      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)
      const state = crypto.randomUUID()

      // Stocke le verifier temporairement dans le canal
      await supabase.from('channels').update({
        oauth_token_secret: codeVerifier, // réutilise le champ pour stocker le verifier
        api_token: state,                 // réutilise pour stocker le state
      }).eq('id', channel_id)

      const params = new URLSearchParams({
        response_type: 'code',
        redirect_uri: callback_url,
        client_id: ETSY_CLIENT_ID,
        scope: 'transactions_r listings_r',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      })

      const authUrl = `https://www.etsy.com/oauth/connect?${params.toString()}`
      console.log('Auth URL generated')

      return new Response(JSON.stringify({ auth_url: authUrl, state }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── ÉTAPE 2 : Échange le code contre un access token ─
    if (body.action === 'access_token') {
      const { code, state, channel_id, callback_url } = body

      // Récupère le code verifier stocké
      const { data: channel } = await supabase
        .from('channels')
        .select('oauth_token_secret, api_token')
        .eq('id', channel_id)
        .single()

      if (!channel) {
        return new Response(JSON.stringify({ error: 'Canal introuvable' }), { status: 404, headers: corsHeaders })
      }

      // Vérifie le state
      if (channel.api_token !== state) {
        return new Response(JSON.stringify({ error: 'State invalide' }), { status: 400, headers: corsHeaders })
      }

      const codeVerifier = channel.oauth_token_secret

      // Échange le code contre les tokens
      const tokenResponse = await fetch('https://api.etsy.com/v3/public/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: ETSY_CLIENT_ID,
          redirect_uri: callback_url,
          code,
          code_verifier: codeVerifier,
        }),
      })

      const tokenData = await tokenResponse.json()
      console.log('Token response status:', tokenResponse.status)

      if (!tokenResponse.ok) {
        return new Response(JSON.stringify({ error: tokenData }), { status: 500, headers: corsHeaders })
      }

      // Récupère le shop_id
      const shopResponse = await fetch('https://openapi.etsy.com/v3/application/users/me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'x-api-key': ETSY_CLIENT_ID,
        },
      })
      const userData = await shopResponse.json()
      console.log('User data:', JSON.stringify(userData))

      // Récupère le shop depuis le user_id
      let shopId = null
      if (userData.user_id) {
        const shopRes = await fetch(
          `https://openapi.etsy.com/v3/application/users/${userData.user_id}/shops`,
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              'x-api-key': ETSY_CLIENT_ID,
            },
          }
        )
        const shopData = await shopRes.json()
        shopId = shopData.shop_id?.toString() ?? null
        console.log('Shop ID:', shopId)
      }

      // Sauvegarde les tokens
      await supabase.from('channels').update({
        oauth_token: tokenData.access_token,
        oauth_token_secret: tokenData.refresh_token,
        api_token: null,
        shop_id: shopId,
        is_active: true,
        last_synced_at: null,
      }).eq('id', channel_id)

      return new Response(JSON.stringify({ success: true, shop_id: shopId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders })

  } catch (err: any) {
    console.error('Error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
