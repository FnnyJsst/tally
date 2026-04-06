import { View, StyleSheet, ViewStyle, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { useTheme } from '../contexts/ThemeContext'
import { Radius } from '../constants/theme'

type Props = {
  children: React.ReactNode
  style?: ViewStyle
  intensity?: number
}

export default function GlassCard({ children, style, intensity = 20 }: Props) {
  const { isDark } = useTheme()

  if (!isDark) {
    return (
      <View style={[styles.light, style]}>
        {children}
      </View>
    )
  }

  if (Platform.OS === 'android') {
    return (
      <View style={[styles.androidDark, style]}>
        {children}
      </View>
    )
  }

  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.glass, style]}>
      <View style={styles.overlay} />
      {children}
    </BlurView>
  )
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.lg,
  },
  light: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  androidDark: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
})
