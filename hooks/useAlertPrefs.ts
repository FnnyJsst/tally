import { useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'

const KEY_ALERTS = 'tally_alerts_enabled'

export function useAlertPrefs() {
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    SecureStore.getItemAsync(KEY_ALERTS).then((val) => {
      if (val !== null) setAlertsEnabled(val === 'true')
      setIsReady(true)
    })
  }, [])

  const setAlerts = async (value: boolean) => {
    setAlertsEnabled(value)
    await SecureStore.setItemAsync(KEY_ALERTS, String(value))
  }

  return { alertsEnabled, setAlerts, isReady }
}
