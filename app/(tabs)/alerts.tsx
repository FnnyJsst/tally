import { useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, SafeAreaView
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useProductStore } from '../../stores/useProductStore'
import { useTheme } from '../../contexts/ThemeContext'
import AuroraBackground from '../../components/AuroraBackground'
import { Spacing, FontSize, Radius, type ColorScheme } from '../../constants/theme'
import type { Product } from '../../types/types'

function AlertCard({ product, colors, styles, onRestock }: {
  product: Product
  colors: ColorScheme
  styles: ReturnType<typeof makeStyles>
  onRestock: () => void
}) {
  const stock = product.totalStock ?? 0
  const isOut = stock <= 0
  const ratio = isOut ? 0 : stock / product.lowStockThreshold

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.indicator, isOut ? styles.indicatorRed : styles.indicatorOrange]} />
        <View style={styles.cardInfo}>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          {product.category ? (
            <Text style={styles.category}>{product.category}</Text>
          ) : null}
        </View>
        <TouchableOpacity style={styles.restockBtn} onPress={onRestock} activeOpacity={0.8}>
          <Text style={styles.restockBtnText}>Réassort</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stockRow}>
        <View style={styles.progressBg}>
          <View style={[
            styles.progressFill,
            isOut ? styles.progressRed : styles.progressOrange,
            { width: `${Math.min(100, Math.max(0, ratio * 100))}%` as any },
          ]} />
        </View>
        <Text style={[styles.stockLabel, isOut ? styles.stockLabelRed : styles.stockLabelOrange]}>
          {isOut ? 'Rupture' : `${stock} / ${product.lowStockThreshold}`}
        </Text>
      </View>
    </View>
  )
}

export default function AlertsScreen() {
  const router = useRouter()
  const { products, fetchProducts, isLoading } = useProductStore()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  useEffect(() => { fetchProducts() }, [])

  const outOfStock = products.filter((p) => (p.totalStock ?? 0) <= 0)
  const lowStock = products.filter(
    (p) => (p.totalStock ?? 0) > 0 && (p.totalStock ?? 0) <= p.lowStockThreshold && p.lowStockThreshold > 0
  )

  const sections = [
    ...(outOfStock.length > 0 ? [{ type: 'header', label: `Ruptures · ${outOfStock.length}`, id: 'h-out' }] : []),
    ...outOfStock.map(p => ({ type: 'product', product: p, id: p.id })),
    ...(lowStock.length > 0 ? [{ type: 'header', label: `Stock bas · ${lowStock.length}`, id: 'h-low' }] : []),
    ...lowStock.map(p => ({ type: 'product', product: p, id: p.id })),
  ]

  const total = outOfStock.length + lowStock.length

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Alertes</Text>
          <Text style={styles.count}>{total > 0 ? `${total} produit${total > 1 ? 's' : ''}` : ''}</Text>
        </View>

        <FlatList
          data={sections as any[]}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchProducts} tintColor={colors.text3} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={56} color={colors.green} />
              <Text style={styles.emptyTitle}>Tout va bien !</Text>
              <Text style={styles.emptyText}>Aucun produit en stock bas ou en rupture.</Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return <Text style={styles.sectionLabel}>{item.label}</Text>
            }
            return (
              <AlertCard
                product={item.product}
                colors={colors}
                styles={styles}
                onRestock={() => router.push(`/(tabs)/stock/new?productId=${item.product.id}` as any)}
              />
            )
          }}
        />
      </SafeAreaView>
    </AuroraBackground>
  )
}

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
    },
    backBtn: { fontSize: FontSize.base, color: colors.text2, minWidth: 60 },
    title: { fontSize: 20, fontWeight: '500', color: colors.text },
    count: { fontSize: FontSize.sm, color: colors.text3, minWidth: 60, textAlign: 'right' },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.sm },
    sectionLabel: {
      fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8,
      textTransform: 'uppercase', color: colors.text3,
      marginTop: Spacing.md, marginBottom: 2,
    },
    card: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    indicator: { width: 8, height: 8, borderRadius: 99, flexShrink: 0 },
    indicatorRed: { backgroundColor: colors.red },
    indicatorOrange: { backgroundColor: colors.orange },
    cardInfo: { flex: 1 },
    productName: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    category: { fontSize: FontSize.xs, color: colors.text3, marginTop: 1 },
    restockBtn: {
      backgroundColor: isDark ? 'rgba(155,127,212,0.2)' : colors.accent,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: 5,
    },
    restockBtnText: {
      fontSize: FontSize.xs, fontWeight: '600',
      color: isDark ? '#C4ADEC' : '#FFF',
    },
    stockRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    progressBg: {
      flex: 1, height: 4, borderRadius: 99,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.surface2,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 99 },
    progressOrange: { backgroundColor: colors.orange },
    progressRed: { backgroundColor: colors.red },
    stockLabel: { fontSize: FontSize.xs, fontVariant: ['tabular-nums'], minWidth: 60, textAlign: 'right' },
    stockLabelOrange: { color: colors.orange },
    stockLabelRed: { color: colors.red },
    empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: '400', color: colors.text },
    emptyText: { fontSize: FontSize.sm, color: colors.text3, textAlign: 'center', paddingHorizontal: Spacing.xl },
  })
}
