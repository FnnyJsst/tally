import { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'
import { Spacing, FontSize, Radius, type ColorScheme } from '../constants/theme'

type Props = {
  name: string
  current: number
  threshold: number
  onPress: () => void
}

export default function AlertRow({ name, current, threshold, onPress }: Props) {
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])
  const isCritical = current <= 1

  return (
    <View style={styles.row}>
      <View style={[styles.dot, isCritical ? styles.dotRed : styles.dotViolet]} />
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <Text style={styles.qty}>{current}/{threshold}</Text>
      <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.btnText}>Maj</Text>
      </TouchableOpacity>
    </View>
  )
}

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surface2,
      borderRadius: Radius.md,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'transparent',
      padding: Spacing.md,
    },
    dot: { width: 7, height: 7, borderRadius: 99, flexShrink: 0 },
    dotRed:    { backgroundColor: colors.red },
    dotViolet: { backgroundColor: colors.accent },
    name: { fontSize: FontSize.sm, fontWeight: '500', color: colors.text, flex: 1 },
    qty:  { fontSize: FontSize.xs, color: colors.text2, fontVariant: ['tabular-nums'] },
    btn: {
      backgroundColor: colors.accent,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
    },
    btnText: { color: '#FFF', fontSize: FontSize.xs, fontWeight: '600' },
  })
}
