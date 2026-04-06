import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { useProductStore } from '../stores/useProductStore'
import { useAlertPrefs } from './useAlertPrefs'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export function useLowStockAlerts() {
  const { products } = useProductStore()
  const { alertsEnabled } = useAlertPrefs()
  const notifiedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!alertsEnabled || products.length === 0) return

    const lowStockProducts = products.filter(
      (p) => (p.totalStock ?? 0) <= p.lowStockThreshold && p.lowStockThreshold > 0
    )

    if (lowStockProducts.length === 0) return

    // Envoie une notif seulement pour les produits pas encore notifiés dans cette session
    const newAlerts = lowStockProducts.filter(p => !notifiedIds.current.has(p.id))
    if (newAlerts.length === 0) return

    requestPermissions().then((granted) => {
      if (!granted) return

      newAlerts.forEach(p => notifiedIds.current.add(p.id))

      if (newAlerts.length === 1) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Stock bas',
            body: `${newAlerts[0].name} — plus que ${newAlerts[0].totalStock ?? 0} unité${(newAlerts[0].totalStock ?? 0) !== 1 ? 's' : ''}`,
          },
          trigger: null,
        })
      } else {
        Notifications.scheduleNotificationAsync({
          content: {
            title: `${newAlerts.length} produits en stock bas`,
            body: newAlerts.map(p => p.name).join(', '),
          },
          trigger: null,
        })
      }
    })
  }, [products, alertsEnabled])
}
