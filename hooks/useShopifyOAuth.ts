import { useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'
import { useChannelStore } from '../stores/useChannelStore'
import { useAuthStore } from '../stores/useAuthStore'

export function useShopifyOAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { fetchChannels } = useChannelStore()
  const { user } = useAuthStore()

  const connectShopify = async (shopDomain: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    const shop = shopDomain.includes('.')
      ? shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
      : `${shopDomain}.myshopify.com`

    try {
      // 1. Crée un canal placeholder
      const { error: chanError } = await supabase.from('channels').insert({
        user_id: user?.id,
        name: shop,
        type: 'shopify',
        is_active: false,
        site_url: shop,
      })
      if (chanError) throw new Error(chanError.message)

      const { data: channel } = await supabase
        .from('channels')
        .select('id')
        .eq('user_id', user?.id)
        .eq('type', 'shopify')
        .eq('is_active', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!channel) throw new Error('Impossible de créer le canal Shopify')

      // 2. Obtient l'URL d'autorisation (la redirect_uri est gérée par la fonction)
      const { data, error: fnError } = await supabase.functions.invoke('shopify-oauth', {
        body: { action: 'auth_url', shop, channel_id: channel.id },
      })

      if (fnError || !data?.auth_url) {
        throw new Error(fnError?.message ?? "Impossible de générer l'URL Shopify")
      }

      // 3. Ouvre Shopify — la fonction gère le callback et redirige vers tally://
      const callbackUrl = Linking.createURL('oauth/shopify', { scheme: 'tally' })
      const result = await WebBrowser.openAuthSessionAsync(data.auth_url, callbackUrl)

      if (result.type !== 'success') {
        await supabase.from('channels').delete().eq('id', channel.id)
        setIsLoading(false)
        return false
      }

      // 4. La fonction a déjà échangé le token — on recharge juste les canaux
      await fetchChannels()
      return true

    } catch (err: any) {
      setError(err.message ?? 'Une erreur est survenue')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { connectShopify, isLoading, error }
}
