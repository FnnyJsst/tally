import { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'
import { Spacing, FontSize, Radius, FontFamily, type ColorScheme } from '../constants/theme'
import type { Product } from '../types'

type Props = {
  product: Product
  onPress: () => void
}

function StatusPill({ stock, threshold, colors }: { stock: number; threshold: number; colors: ColorScheme }) {
  const cfg = stock === 0
    ? { bg: colors.redBg, border: colors.redBorder, text: colors.red, label: 'Rupture' }
    : stock <= threshold
    ? { bg: colors.orangeBg, border: colors.orangeBorder, text: colors.orange, label: 'Bas' }
    : { bg: colors.greenBg, border: colors.greenBorder, text: colors.green, label: 'OK' }

  return (
    <View style={[pill.base, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[pill.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  )
}

const pill = StyleSheet.create({
  base: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1 },
  text: { fontSize: 9, fontWeight: '600' },
})

export default function ProductCard({ product, onPress }: Props) {
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])
  const stock = product.totalStock ?? 0

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.thumb}>
        {product.photoUrl ? (
          <Image source={{ uri: product.photoUrl }} style={styles.thumbImage} />
        ) : (
          <Text style={styles.thumbText}>{product.name[0]?.toUpperCase() ?? '?'}</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.meta}>
          {product.hasVariants ? `${product.variants?.length ?? 0} variantes` : 'Produit simple'}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[
          styles.stock,
          stock === 0 && { color: colors.red },
          stock > 0 && stock <= product.lowStockThreshold && { color: colors.orange },
        ]}>
          {stock}
        </Text>
        <StatusPill stock={stock} threshold={product.lowStockThreshold} colors={colors} />
      </View>
    </TouchableOpacity>
  )
}

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
    },
    thumb: {
      width: 42, height: 42,
      borderRadius: Radius.sm,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.surface2,
      borderWidth: isDark ? 1 : 0,
      borderColor: 'rgba(255,255,255,0.10)',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden',
    },
    thumbImage: { width: '100%', height: '100%' },
    thumbText: { fontSize: FontSize.lg, color: colors.text2, fontWeight: '300' },
    info: { flex: 1, minWidth: 0 },
    name: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    meta: { fontSize: FontSize.xs, color: colors.text3, marginTop: 2 },
    right: { alignItems: 'flex-end', gap: 4 },
    stock: {
      fontSize: FontSize.xl,
      fontFamily: FontFamily.display,
      color: colors.text,
      fontVariant: ['tabular-nums'],
      letterSpacing: -0.5,
    },
  })
}
