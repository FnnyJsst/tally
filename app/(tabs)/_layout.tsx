import { Tabs } from 'expo-router'
import GlassTabBar from '../../components/GlassTabBar'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="products" options={{ title: 'Produits' }} />
      <Tabs.Screen name="stock" options={{ title: 'Stock' }} />
      <Tabs.Screen name="channels" options={{ title: 'Canaux' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="settings" options={{ title: 'Réglages' }} />
      <Tabs.Screen name="alerts" options={{ href: null }} />
      <Tabs.Screen name="channels/new" options={{ href: null }} />
      <Tabs.Screen name="settings/profile" options={{ href: null }} />
      <Tabs.Screen name="settings/import-csv" options={{ href: null }} />
    </Tabs>
  )
}
