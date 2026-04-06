import { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Font from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/useAuthStore'
import { useProductStore } from '../stores/useProductStore'
import { useLowStockAlerts } from '../hooks/useLowStockAlerts'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'

SplashScreen.preventAutoHideAsync()

function RootLayoutInner() {
  const router = useRouter()
  const segments = useSegments()
  const { isAuthenticated, fetchUser } = useAuthStore()
  const { fetchProducts } = useProductStore()
  const { isDark } = useTheme()
  const [ready, setReady] = useState(false)
  useLowStockAlerts()

  useEffect(() => {
    if (isAuthenticated) fetchProducts()
  }, [isAuthenticated])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          await fetchUser()
        } else {
          useAuthStore.setState({ isAuthenticated: false, user: null })
        }
      }
    )
    fetchUser().finally(() => setReady(true))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!ready) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome')
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [ready, isAuthenticated, segments])

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false)

  useEffect(() => {
    Font.loadAsync({
      OpenSans_400Regular: require('../node_modules/@expo-google-fonts/open-sans/400Regular/OpenSans_400Regular.ttf'),
      OpenSans_700Bold: require('../node_modules/@expo-google-fonts/open-sans/700Bold/OpenSans_700Bold.ttf'),
      OpenSans_400Regular_Italic: require('../node_modules/@expo-google-fonts/open-sans/400Regular_Italic/OpenSans_400Regular_Italic.ttf'),
    }).then(() => {
      setFontsLoaded(true)
      SplashScreen.hideAsync()
    }).catch(() => {
      setFontsLoaded(true)
      SplashScreen.hideAsync()
    })
  }, [])

  if (!fontsLoaded) return null

  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  )
}
