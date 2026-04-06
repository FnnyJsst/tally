import { useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'
import { useChannelStore } from '../stores/useChannelStore'
import { useAuthStore } from '../stores/useAuthStore'

export function useEtsyOAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { fetchChannels } = useChannelStore()
  const { user } = useAuthStore()

  const connectEtsy = async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Crée un canal placeholder
      const { error: chanError } = await supabase.from('channels').insert({
        user_id: user?.id,
        name: 'Etsy',
        type: 'etsy',
        is_active: false,
      })
      if (chanError) throw new Error(chanError.message)

      const { data: channel } = await supabase
        .from('channels')
        .select('id')
        .eq('user_id', user?.id)
        .eq('type', 'etsy')
        .eq('is_active', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!channel) throw new Error('Impossible de créer le canal Etsy')

      const callbackUrl = Linking.createURL('oauth/etsy', { scheme: 'tally' })

      // 2. Obtient l'URL d'autorisation OAuth 2.0 PKCE
      const { data, error: fnError } = await supabase.functions.invoke('etsy-oauth', {
        body: {
          action: 'auth_url',
          callback_url: callbackUrl,
          channel_id: channel.id,
        },
      })

      if (fnError || !data?.auth_url) {
        throw new Error(fnError?.message ?? 'Impossible de générer l\'URL Etsy')
      }

      // 3. Ouvre le navigateur sur etsy.com
      const result = await WebBrowser.openAuthSessionAsync(data.auth_url, callbackUrl)

      if (result.type !== 'success') {
        await supabase.from('channels').delete().eq('id', channel.id)
        setIsLoading(false)
        return false
      }

      // 4. Parse le callback
      const url = new URL(result.url)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')

      if (!code || !state) {
        throw new Error('Callback Etsy invalide')
      }

      // 5. Échange le code contre l'access token
      const { error: accessError } = await supabase.functions.invoke('etsy-oauth', {
        body: {
          action: 'access_token',
          code,
          state,
          channel_id: channel.id,
          callback_url: callbackUrl,
        },
      })

      if (accessError) throw new Error(accessError.message)

      await fetchChannels()
      return true

    } catch (err: any) {
      setError(err.message ?? 'Une erreur est survenue')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { connectEtsy, isLoading, error }
}
