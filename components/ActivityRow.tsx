import { View, Text, StyleSheet } from 'react-native'
import { Colors, Spacing, FontSize, Radius } from '../constants/theme'
import type { MovementType } from '../types/types'

type Props = {
  productName: string
  quantity: number
  type: MovementType
  channelName: string
  date: string
}

const TYPE_CONFIG: Record<MovementType, { icon: string; bg: string }> = {
  sale:       { icon: '↓', bg: Colors.redBg },
  restock:    { icon: '↑', bg: Colors.greenBg },
  adjustment: { icon: '⚙', bg: Colors.surface2 },
  transfer:   { icon: '→', bg: Colors.orangeBg },
  loss:       { icon: '✕', bg: Colors.surface2 },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  return `il y a ${days}j`
}

export default function ActivityRow({ productName, quantity, type, channelName, date }: Props) {
  const config = TYPE_CONFIG[type]
  const isPositive = quantity > 0

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: config.bg }]}>
        <Text style={styles.iconText}>{config.icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{productName}</Text>
        <Text style={styles.meta}>{timeAgo(date)}</Text>
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.text3,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
  },
  qty: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  qtyPos: { color: Colors.green },
  qtyNeg: { color: Colors.red },
  tag: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 9,
    color: Colors.text2,
    fontWeight: '500',
  },
})
