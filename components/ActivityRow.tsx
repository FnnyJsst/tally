import { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'
import { Spacing, FontSize, Radius, type ColorScheme } from '../constants/theme'
import type { MovementType } from '../types/types'

type Props = {
  productName: string
  quantity: number
  type: MovementType
  channelName: string
  date: string
  note?: string
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  if (!dateStr || isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  return `il y a ${days}j`
}

export default function ActivityRow({ productName, quantity, type, channelName, date, note }: Props) {
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  const TYPE_CONFIG: Record<MovementType, { icon: string; bg: string; color: string }> = {
    sale:       { icon: '↓', bg: colors.redBg,    color: colors.red },
    restock:    { icon: '↑', bg: colors.greenBg,  color: colors.green },
    adjustment: { icon: '⚙', bg: colors.surface2, color: colors.text2 },
    transfer:   { icon: '→', bg: colors.orangeBg, color: colors.orange },
    loss:       { icon: '✕', bg: colors.surface2, color: colors.text3 },
  }

  const config = TYPE_CONFIG[type]
  const isPositive = quantity > 0

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: config.bg }]}>
        <Text style={[styles.iconText, { color: config.color }]}>{config.icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{productName}</Text>
        <Text style={styles.meta}>{timeAgo(date)}</Text>
        {note ? <Text style={styles.note} numberOfLines={1}>{note}</Text> : null}
      </View>
      <View style={styles.right}>
        <Text style={[styles.qty, isPositive ? styles.qtyPos : styles.qtyNeg]}>
          {isPositive ? '+' : ''}{quantity}
        </Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{channelName}</Text>
        </View>
      </View>
    </View>
  )
}

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
    },
    icon: {
      width: 32, height: 32,
      borderRadius: Radius.sm,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    iconText: { fontSize: FontSize.sm },
    info: { flex: 1, minWidth: 0 },
    name: { fontSize: FontSize.sm, fontWeight: '500', color: colors.text },
    meta: { fontSize: FontSize.xs, color: colors.text3, marginTop: 2 },
    note: { fontSize: FontSize.xs, color: colors.text2, fontStyle: 'italic', marginTop: 1 },
    right: { alignItems: 'flex-end', gap: 3 },
    qty: { fontSize: FontSize.sm, fontWeight: '600', fontVariant: ['tabular-nums'] },
    qtyPos: { color: colors.green },
    qtyNeg: { color: colors.red },
    tag: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.surface2,
      borderRadius: Radius.full,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderWidth: isDark ? 1 : 0,
      borderColor: 'rgba(255,255,255,0.10)',
    },
    tagText: { fontSize: 9, color: colors.text2, fontWeight: '500' },
  })
}
