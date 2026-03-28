import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors, Spacing, FontSize, Radius } from '../constants/theme'
import type { Product } from '../types'

type Props = {
  product: Product
  onPress: () => void
}

function StatusPill({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock === 0) {
    return (
      <View style={[styles.pill, { backgroundColor: Colors.redBg }]}>
        <Text style={[styles.pillText, { color: Colors.red }]}>Rupture</Text>
      </View>
    )
  }
  if (stock <= threshold) {
    return (
      <View style={[styles.pill, { backgroundColor: Colors.orangeBg }]}>
        <Text style={[styles.pillText, { color: Colors.orange }]}>Bas</Text>
      </View>
    )
  }
  return (
    <View style={[styles.pill, { backgroundColor: Colors.greenBg }]}>
      <Text style={[styles.pillText, { color: Colors.green }]}>OK</Text>
    </View>
  )
}

export default function ProductCard({ product, onPress }: Props) {
  const stock = product.totalStock ?? 0
  const isLow = stock <= product.lowStockThreshold

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.thumb}>
        <Text style={styles.thumbText}>
          {product.name[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.meta}>
          {product.hasVariants ? `${product.variants?.length ?? 0} variantes` : 'Produit simple'}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.stock, isLow && { color: Colors.red }]}>
          {stock}
        </Text>
        <StatusPill stock={stock} threshold={product.lowStockThreshold} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbText: {
    fontSize: FontSize.lg,
    color: Colors.text2,
    fontWeight: '300',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: FontSize.base,
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
    gap: 4,
  },
  stock: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  pillText: {
    fontSize: 9,
    fontWeight: '500',
  },
})
