import { useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/useAuthStore'
import { useProductStore } from '../../stores/useProductStore'
import { useStockStore } from '../../stores/useStockStore'
import { useChannelStore } from '../../stores/useChannelStore'
import StatCard from '../../components/StatCard'
import AlertRow from '../../components/AlertRow'
import ActivityRow from '../../components/ActivityRow'
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme'

export default function DashboardScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { products, fetchProducts, isLoading: loadingProducts } = useProductStore()
  const { entries, fetchEntries, isLoading: loadingEntries } = useStockStore()
  const { channels, fetchChannels } = useChannelStore()

  const load = useCallback(async () => {
    await Promise.all([fetchProducts(), fetchEntries(20), fetchChannels()])
  }, [])

  useEffect(() => { load() }, [])

  const alertProducts = products.filter(
    (p) => (p.totalStock ?? 0) <= p.lowStockThreshold
  )

  const recentEntries = entries.slice(0, 5)
  const isRefreshing = loadingProducts || loadingEntries
  const firstName = user?.shopName?.split(' ')[0] ?? 'toi'

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={load} tintColor={Colors.text3} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Bonjour, <Text style={styles.greetingItalic}>{firstName}</Text>
          </Text>
          <Text style={styles.syncLabel}>
            {channels.length > 0 ? `${channels.length} canaux actifs` : 'Aucun canal configuré'}
          </Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.shopName?.[0]?.toUpperCase() ?? 'T'}
          </Text>
        </View>
      </View>

      <View style={styles.bentoRow}>
        <StatCard
          label="Références"
          value={products.length}
          pill="+3 ce mois"
          pillColor="white"
          dark
        />
        <View style={styles.bentoCol}>
          <StatCard
            label="Canaux"
            value={channels.length}
            pill="Sync."
            pillColor="green"
          />
          <StatCard
            label="Alertes"
            value={alertProducts.length}
            pill={alertProducts.length > 0 ? 'Critiques' : 'OK'}
            pillColor={alertProducts.length > 0 ? 'red' : 'green'}
          />
        </View>
      </View>

      {alertProducts.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Stock bas</Text>
          <View style={styles.alertList}>
            {alertProducts.slice(0, 3).map((product) => (
              <AlertRow
                key={product.id}
                name={product.name}
                current={product.totalStock ?? 0}
                threshold={product.lowStockThreshold}
                onPress={() => router.push(`/tabs/products/${product.id}` as any)}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Activité récente</Text>
          <TouchableOpacity onPress={() => router.push('/tabs/stock' as any)}>
            <Text style={styles.sectionLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {recentEntries.length === 0 ? (
          <Text style={styles.empty}>Aucun mouvement pour l'instant</Text>
        ) : (
          recentEntries.map((entry) => (
            <ActivityRow
              key={entry.id}
              productName={(entry as any).variants?.products?.name ?? 'Produit inconnu'}
              quantity={entry.quantity}
              type={entry.type}
              channelName={(entry as any).channels?.name ?? '—'}
              date={entry.occurredAt}
            />
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/tabs/stock/new' as any)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  container: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 100, gap: Spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  greeting: { fontSize: 22, fontWeight: '400', color: Colors.text, letterSpacing: -0.5 },
  greetingItalic: { fontStyle: 'italic', fontWeight: '300', color: Colors.text2 },
  syncLabel: { fontSize: FontSize.xs, color: Colors.text3, marginTop: 3 },
  avatar: { width: 36, height: 36, borderRadius: 99, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontSize: FontSize.sm, fontWeight: '500' },
  bentoRow: { flexDirection: 'row', gap: Spacing.sm, minHeight: 140 },
  bentoCol: { flex: 1, gap: Spacing.sm },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: '500', letterSpacing: 0.7, textTransform: 'uppercase', color: Colors.text3 },
  sectionLink: { fontSize: FontSize.xs, color: Colors.text2, textDecorationLine: 'underline' },
  alertList: { gap: Spacing.sm },
  empty: { fontSize: FontSize.sm, color: Colors.text3, textAlign: 'center', paddingVertical: Spacing.lg },
  fab: { position: 'absolute', bottom: 90, right: Spacing.lg, width: 48, height: 48, borderRadius: 99, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { color: 'white', fontSize: 24, fontWeight: '300', lineHeight: 28 },
})
