import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity, RefreshControl
} from 'react-native'
import { useRouter } from 'expo-router'
import { useProductStore } from '../../../stores/useProductStore'
import ProductCard from '../../../components/ProductCard'
import { Colors, Spacing, FontSize, Radius } from '../../../constants/theme'
import type { Product } from '../../../types'

const FILTERS = ['Tous', 'Stock bas', 'Bijoux', 'Déco', 'Mobilier', 'Textile']

export default function ProductsScreen() {
  const router = useRouter()
  const { products, fetchProducts, isLoading } = useProductStore()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('Tous')

  useEffect(() => { fetchProducts() }, [])

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      activeFilter === 'Tous' ? true :
      activeFilter === 'Stock bas' ? (p.totalStock ?? 0) <= p.lowStockThreshold :
      p.category === activeFilter
    return matchSearch && matchFilter
  })

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Produits</Text>
        <Text style={styles.count}>{products.length} réf.</Text>
      </View>

      {/* Recherche */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher..."
          placeholderTextColor={Colors.text3}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.lg }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
            onPress={() => setActiveFilter(item)}
          >
            <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Liste */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchProducts} tintColor={Colors.text3} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {search ? 'Aucun résultat' : 'Aucun produit'}
            </Text>
            <Text style={styles.emptyText}>
              {search ? 'Essaie un autre terme' : 'Crée ton premier produit avec le bouton +'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => router.push(`/(tabs)/products/${item.id}` as any)}
          />
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/products/new' as any)}
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
    marginBottom: Spacing.md,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: Radius.full,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.text,
    paddingVertical: 10,
  },
  clearBtn: {
    fontSize: FontSize.xs,
    color: Colors.text3,
    padding: 4,
  },
  filterList: {
    maxHeight: 36,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.text2,
  },
  filterTextActive: {
    color: 'white',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
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
