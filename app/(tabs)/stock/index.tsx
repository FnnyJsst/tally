import { useEffect } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl
} from 'react-native'
import { useRouter } from 'expo-router'
import { useProductStore } from '../../../stores/useProductStore'
import { Colors, Spacing, FontSize, Radius } from '../../../constants/theme'

export default function StockScreen() {
  const router = useRouter()
  const { products, fetchProducts, isLoading } = useProductStore()

  useEffect(() => { fetchProducts() }, [])

  const sorted = [...products].sort((a, b) => {
    const aStock = a.totalStock ?? 0
    const bStock = b.totalStock ?? 0
    const aRatio = aStock / Math.max(a.lowStockThreshold, 1)
    const bRatio = bStock / Math.max(b.lowStockThreshold, 1)
    return aRatio - bRatio
  })

  const maxStock = Math.max(...products.map(p => p.totalStock ?? 0), 1)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stock</Text>
        <Text style={styles.count}>{products.length} réf.</Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchProducts} tintColor={Colors.text3} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucun produit</Text>
            <Text style={styles.emptyText}>Crée d'abord des produits dans l'onglet Produits</Text>
          </View>
        }
        renderItem={({ item }) => {
          const stock = item.totalStock ?? 0
          const isLow = stock <= item.lowStockThreshold
          const isEmpty = stock === 0
          const barWidth = Math.min((stock / maxStock) * 100, 100)

          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/(tabs)/products/${item.id}` as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.barWrap}>
                <View style={[
                  styles.bar,
                  isEmpty ? styles.barEmpty :
                  isLow ? styles.barLow : styles.barOk,
                  { width: `${Math.max(barWidth, 2)}%` }
                ]} />
              </View>
              <Text style={[
                styles.rowStock,
                isEmpty && { color: Colors.red },
                isLow && !isEmpty && { color: Colors.orange },
              ]}>
                {stock}
              </Text>
            </TouchableOpacity>
          )
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/stock/new' as any)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '400',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  count: {
    fontSize: FontSize.xs,
    color: Colors.text3,
    fontVariant: ['tabular-nums'],
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowName: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    width: 110,
  },
  barWrap: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surface2,
    borderRadius: 99,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 99,
  },
  barOk: { backgroundColor: Colors.green },
  barLow: { backgroundColor: Colors.orange },
  barEmpty: { backgroundColor: Colors.red },
  rowStock: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    width: 28,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '400',
    color: Colors.text,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.text3,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 99,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
})
