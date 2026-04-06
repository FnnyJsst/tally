import { useEffect, useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity, RefreshControl, SafeAreaView
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useProductStore } from '../../../stores/useProductStore'
import { useTheme } from '../../../contexts/ThemeContext'
import ProductCard from '../../../components/ProductCard'
import AuroraBackground from '../../../components/AuroraBackground'
import { Spacing, FontSize, Radius, type ColorScheme } from '../../../constants/theme'

const FILTERS = ['Tous', 'Stock bas', 'Bijoux', 'Déco', 'Mobilier', 'Textile']

export default function ProductsScreen() {
  const router = useRouter()
  const { products, fetchProducts, isLoading } = useProductStore()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])
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
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Produits</Text>
            <Text style={styles.count}>{products.length} réf.</Text>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={colors.text3} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher..."
              placeholderTextColor={colors.text3}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={colors.text3} />
              </TouchableOpacity>
            )}
          </View>

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

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={fetchProducts} tintColor={colors.text3} />
            }
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="cube-outline" size={48} color={colors.text3} />
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
        </View>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(tabs)/products/new' as any)}
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
    count: { fontSize: FontSize.sm, color: colors.text3 },
    searchBar: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface2,
      borderRadius: Radius.full,
      marginHorizontal: Spacing.lg, paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md, gap: Spacing.sm, height: 44,
    },
    searchInput: { flex: 1, fontSize: FontSize.base, color: colors.text },
    filterList: { maxHeight: 40, marginBottom: Spacing.md, flexGrow: 0 },
    filterChip: {
      paddingHorizontal: Spacing.md, paddingVertical: 7,
      borderRadius: Radius.full, borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface,
    },
    filterChipActive: {
      backgroundColor: isDark ? 'rgba(155,127,212,0.2)' : colors.accent,
      borderColor: isDark ? 'rgba(155,127,212,0.4)' : colors.accent,
    },
    filterText: { fontSize: FontSize.sm, fontWeight: '500', color: colors.text2 },
    filterTextActive: { color: isDark ? '#C4ADEC' : '#FFF' },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: 160 },
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
