import { Tabs } from 'expo-router'
import { Colors } from '../../constants/theme'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 12,
          height: 64,
        },
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.text3,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '500',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarIcon: ({ color }) => null }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: 'Produits', tabBarIcon: ({ color }) => null }}
      />
      <Tabs.Screen
        name="stock"
        options={{ title: 'Stock', tabBarIcon: ({ color }) => null }}
      />
      <Tabs.Screen
        name="channels"
        options={{ title: 'Canaux', tabBarIcon: ({ color }) => null }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Réglages', tabBarIcon: ({ color }) => null }}
      />
    </Tabs>
  )
}
