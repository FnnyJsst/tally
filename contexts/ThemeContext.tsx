import { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { lightColors, darkColors, type ColorScheme } from '../constants/theme'

type ThemeContextType = {
  colors: ColorScheme
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
})

const KEY_DARK_MODE = 'tally_dark_mode'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    SecureStore.getItemAsync(KEY_DARK_MODE).then((val) => {
      if (val === 'true') setIsDark(true)
    })
  }, [])

  const toggleTheme = async () => {
    const next = !isDark
    setIsDark(next)
    await SecureStore.setItemAsync(KEY_DARK_MODE, String(next))
  }

  const colors = isDark ? darkColors : lightColors

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
