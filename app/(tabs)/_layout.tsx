import { Tabs } from 'expo-router'
import { Colors } from '../../constants/theme'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.text3,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          paddingTop: 8,
          paddingBottom: 12,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="products/index" options={{ title: 'Produits' }} />
      <Tabs.Screen name="stock/index" options={{ title: 'Stock' }} />
      <Tabs.Screen name="channels" options={{ title: 'Canaux' }} />
      <Tabs.Screen name="settings" options={{ title: 'Réglages' }} />
      <Tabs.Screen name="products/[id]" options={{ href: null }} />
      <Tabs.Screen name="stock/new" options={{ href: null }} />
      <Tabs.Screen name="products/new" options={{ href: null }} />
    </Tabs>
  )
}