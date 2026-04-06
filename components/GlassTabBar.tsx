import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../contexts/ThemeContext'
import { Radius } from '../constants/theme'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

const ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  index:    { active: 'grid',           inactive: 'grid-outline' },
  products: { active: 'cube',           inactive: 'cube-outline' },
  stock:    { active: 'layers',         inactive: 'layers-outline' },
  channels: { active: 'git-network',    inactive: 'git-network-outline' },
  stats:    { active: 'bar-chart',      inactive: 'bar-chart-outline' },
  settings: { active: 'settings',       inactive: 'settings-outline' },
}

const LABELS: Record<string, string> = {
  index:    'Accueil',
  products: 'Produits',
  stock:    'Stock',
  channels: 'Canaux',
  stats:    'Stats',
  settings: 'Réglages',
}

export default function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { colors, isDark } = useTheme()

  const visibleRoutes = state.routes.filter(r => r.name in ICONS)

  const content = (
    <View style={[styles.inner, { paddingBottom: Math.max(insets.bottom - 20, 8) }]}>
      {visibleRoutes.map((route) => {
        const isFocused = state.index === state.routes.indexOf(route)
        const icons = ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' }
        const label = LABELS[route.name] ?? route.name
        const iconColor = isFocused
          ? (isDark ? '#FFFFFF' : colors.accent)
          : (isDark ? 'rgba(255,255,255,0.35)' : colors.text3)

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name)
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFocused ? icons.active : icons.inactive}
              size={22}
              color={iconColor}
            />
            <Text style={[styles.label, { color: iconColor }]}>
              {label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  if (isDark) {
    if (Platform.OS === 'android') {
      return (
        <View style={[styles.container, styles.containerDarkAndroid]}>
          {content}
        </View>
      )
    }
    return (
      <BlurView intensity={60} tint="dark" style={[styles.container, styles.containerDark]}>
        <View style={styles.darkOverlay} />
        {content}
      </BlurView>
    )
  }

  if (Platform.OS === 'android') {
    return (
      <View style={[styles.container, { backgroundColor: 'rgba(244,245,247,0.97)' }]}>
        {content}
      </View>
    )
  }

  return (
    <BlurView intensity={80} tint="systemUltraThinMaterial" style={styles.container}>
      <View style={styles.lightOverlay} />
      {content}
    </BlurView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#9B7FD4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  containerDark: {
    borderColor: 'rgba(255,255,255,0.08)',
    shadowOpacity: 0.4,
  },
  containerDarkAndroid: {
    backgroundColor: 'rgba(13,8,32,0.92)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,8,32,0.65)',
  },
  lightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  inner: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    borderRadius: Radius.lg,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: 0, left: 8, right: 8, bottom: 0,
    borderRadius: Radius.md,
  },
  label: {
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
})
