import { useEffect, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, RefreshControl, SafeAreaView
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useProductStore } from '../../../stores/useProductStore'
import { useTheme } from '../../../contexts/ThemeContext'
import AuroraBackground from '../../../components/AuroraBackground'
import { Spacing, FontSize, Radius, FontFamily, type ColorScheme } from '../../../constants/theme'

export default function StockScreen() {
  const router = useRouter()
  const { products, fetchProducts, isLoading } = useProductStore()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  useEffect(() => { fetchProducts() }, [])

  const sorted = [...products].sort((a, b) => {
    const aRatio = (a.totalStock ?? 0) / Math.max(a.lowStockThreshold, 1)
    const bRatio = (b.totalStock ?? 0) / Math.max(b.lowStockThreshold, 1)
    return aRatio - bRatio
  })

  const maxStock = Math.max(...products.map(p => p.totalStock ?? 0), 1)

  const nbOk = products.filter(p => (p.totalStock ?? 0) > p.lowStockThreshold).length
  const nbLow = products.filter(p => (p.totalStock ?? 0) > 0 && (p.totalStock ?? 0) <= p.lowStockThreshold).length
  const nbOut = products.filter(p => (p.totalStock ?? 0) === 0).length

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Stock</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/stock/history' as any)}>
              <Ionicons name="time-outline" size={22} color={colors.text2} />
            </TouchableOpacity>
          </View>

          {/* Summary mini-cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: colors.greenBg, borderColor: colors.greenBorder }]}>
              <Text style={[styles.summaryValue, { color: colors.green, fontFamily: FontFamily.display }]}>{nbOk}</Text>
              <Text style={[styles.summaryLabel, { color: colors.green }]}>OK</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.orangeBg, borderColor: colors.orangeBorder }]}>
              <Text style={[styles.summaryValue, { color: colors.orange, fontFamily: FontFamily.display }]}>{nbLow}</Text>
              <Text style={[styles.summaryLabel, { color: colors.orange }]}>Bas</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.redBg, borderColor: colors.redBorder }]}>
              <Text style={[styles.summaryValue, { color: colors.red, fontFamily: FontFamily.display }]}>{nbOut}</Text>
              <Text style={[styles.summaryLabel, { color: colors.red }]}>Rupture</Text>
            </View>
          </View>

          <FlatList
            data={sorted}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={fetchProducts} tintColor={colors.text3} />
            }
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="layers-outline" size={48} color={colors.text3} />
                <Text style={styles.emptyTitle}>Aucun produit</Text>
                <Text style={styles.emptyText}>Crée d'abord des produits dans l'onglet Produits</Text>
              </View>
            }
            renderItem={({ item }) => {
              const stock = item.totalStock ?? 0
              const isLow = stock <= item.lowStockThreshold
              const isEmpty = stock === 0
              const barWidth = Math.min((stock / maxStock) * 100, 100)
              const margin = stock - item.lowStockThreshold
              const marginLabel = isEmpty
                ? 'Rupture'
                : isLow
                  ? `${Math.abs(margin)} sous seuil`
                  : `seuil : ${item.lowStockThreshold}`

              const barColor = isEmpty
                ? colors.red
                : isLow
                  ? colors.orange
                  : colors.accent

              return (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => router.push(`/(tabs)/products/${item.id}` as any)}
                  activeOpacity={0.7}
                >
                  {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={styles.rowThumb} />
                  ) : (
                    <View style={styles.rowThumbEmpty}>
                      <Text style={styles.rowThumbText}>{item.name[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.barWrap}>
                      <View style={[
                        styles.bar,
                        { width: `${Math.max(barWidth, 2)}%`, backgroundColor: barColor }
                      ]} />
                    </View>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[
                      styles.rowStock,
                      isEmpty && { color: colors.red },
                      isLow && !isEmpty && { color: colors.orange },
                    ]}>
                      {stock}
                    </Text>
                    <Text style={[
                      styles.rowMargin,
                      isEmpty && { color: colors.red },
                      isLow && !isEmpty && { color: colors.orange },
                    ]}>
                      {marginLabel}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            }}
          />
        </View>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(tabs)/stock/new' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>
    </AuroraBackground>
  )
}

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    container: { flex: 1 },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, marginBottom: Spacing.md,
    },
    title: { fontSize: 26, fontWeight: '400', color: colors.text, letterSpacing: -0.5 },
    summaryRow: {
      flexDirection: 'row', gap: Spacing.sm,
      paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
    },
    summaryCard: {
      flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
      borderRadius: Radius.md, borderWidth: 1,
    },
    summaryValue: { fontSize: FontSize.xl, letterSpacing: -0.5 },
    summaryLabel: { fontSize: FontSize.xs, fontWeight: '600', marginTop: 2 },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      paddingVertical: Spacing.md, borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
    },
    rowInfo: { flex: 1, gap: 5 },
    rowName: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    barWrap: {
      height: 5,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface2,
      borderRadius: Radius.full, overflow: 'hidden',
    },
    bar: { height: '100%', borderRadius: Radius.full },
    rowRight: { alignItems: 'flex-end', gap: 2, minWidth: 52 },
    rowStock: {
      fontSize: FontSize.lg,
      fontFamily: FontFamily.display,
      color: colors.text,
      fontVariant: ['tabular-nums'],
      letterSpacing: -0.5,
    },
    rowMargin: { fontSize: 9, color: colors.text3, fontWeight: '500' },
    rowThumb: { width: 36, height: 36, borderRadius: Radius.sm, flexShrink: 0 },
    rowThumbEmpty: {
      width: 36, height: 36, borderRadius: Radius.sm,
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface2,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    rowThumbText: { fontSize: FontSize.base, color: colors.text2, fontWeight: '300' },
    empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: '400', color: colors.text },
    emptyText: { fontSize: FontSize.sm, color: colors.text3, textAlign: 'center', paddingHorizontal: Spacing.xl },
    fab: {
      position: 'absolute', bottom: 100, right: Spacing.lg,
      width: 52, height: 52, borderRadius: 99,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12, elevation: 6,
    },
  })
}
