import { useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity, SafeAreaView, Image
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/useAuthStore'
import { useProductStore } from '../../stores/useProductStore'
import { useStockStore } from '../../stores/useStockStore'
import { useChannelStore } from '../../stores/useChannelStore'
import { useAlertPrefs } from '../../hooks/useAlertPrefs'
import { useTheme } from '../../contexts/ThemeContext'
import AuroraBackground from '../../components/AuroraBackground'
import StatCard from '../../components/StatCard'
import AlertRow from '../../components/AlertRow'
import StockFlowCard from '../../components/StockFlowCard'
import { Spacing, FontSize, Radius, FontFamily, type ColorScheme } from '../../constants/theme'

export default function DashboardScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { products, fetchProducts, isLoading: loadingProducts } = useProductStore()
  const { fetchEntries, isLoading: loadingEntries } = useStockStore()
  const { channels, fetchChannels } = useChannelStore()
  const { alertsEnabled } = useAlertPrefs()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  const load = useCallback(async () => {
    await Promise.all([fetchProducts(), fetchEntries(20), fetchChannels()])
  }, [])

  useEffect(() => { load() }, [])

  const alertProducts = products.filter(
    (p) => (p.totalStock ?? 0) <= p.lowStockThreshold
  )
  const lowStockProducts = products.filter(
    (p) => (p.totalStock ?? 0) > 0 && (p.totalStock ?? 0) <= p.lowStockThreshold
  )
  const outOfStockProducts = products.filter(
    (p) => (p.totalStock ?? 0) <= 0
  )

  const isRefreshing = loadingProducts || loadingEntries

  const firstName = user?.shopName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'toi'

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={load} tintColor={colors.text3} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={() => router.push('/(tabs)/settings/profile' as any)}
                activeOpacity={0.8}
              >
                {user?.photo_url ? (
                  <Image source={{ uri: user.photo_url }} style={styles.avatarImage} />
                ) : (
                  <>
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.accent, borderRadius: 99 }]} />
                    <Text style={styles.avatarText}>
                      {(user?.shopName?.[0] ?? user?.email?.[0] ?? 'T').toUpperCase()}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <View>
                <Text style={styles.greeting}>Bonjour 👋</Text>
                <Text style={styles.greetingName}>{firstName}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => router.push('/(tabs)/alerts' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {alertProducts.length > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {alertProducts.length > 9 ? '9+' : alertProducts.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Bento grid */}
          <View style={styles.bentoGrid}>
            <View style={styles.bentoRow}>
              <StatCard
                label="Références"
                value={products.length}
                icon="cube-outline"
                iconBg="rgba(255,255,255,0.2)"
                iconColor="#FFFFFF"
                actionLabel="Ajouter"
                onAction={() => router.push('/(tabs)/products/new' as any)}
                dark
              />
              <StatCard
                label="Canaux"
                value={channels.length}
                icon="link-outline"
                iconBg={colors.greenBg}
                iconColor={colors.green}
                actionLabel="Ajouter"
                onAction={() => router.push('/(tabs)/channels/new' as any)}
              />
            </View>
            <View style={styles.bentoRow}>
              <StatCard
                label="Stocks bas"
                value={lowStockProducts.length}
                icon="bar-chart-outline"
                iconBg={colors.orangeBg}
                iconColor={colors.orange}
                actionLabel="Restock"
                onAction={() => router.push('/(tabs)/stock/new' as any)}
              />
              <StatCard
                label="Ruptures"
                value={outOfStockProducts.length}
                icon="warning-outline"
                iconBg={colors.redBg}
                iconColor={colors.red}
                actionLabel="Gérer"
                onAction={() => router.push('/(tabs)/stock' as any)}
              />
            </View>
          </View>

          {/* Alertes stock bas */}
          {alertsEnabled && alertProducts.length > 0 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Stock bas</Text>
                {alertProducts.length > 3 && (
                  <TouchableOpacity onPress={() => router.push('/(tabs)/alerts' as any)}>
                    <Text style={styles.sectionLink}>Voir tout ({alertProducts.length}) →</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.alertList}>
                {alertProducts.slice(0, 3).map((product) => (
                  <AlertRow
                    key={product.id}
                    name={product.name}
                    current={product.totalStock ?? 0}
                    threshold={product.lowStockThreshold}
                    onPress={() => router.push(`/(tabs)/stock/new?productId=${product.id}` as any)}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Activité récente</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/stock' as any)}>
               <Text style={styles.sectionLink}>Voir tout  →</Text>
            </TouchableOpacity>
          </View>

          <StockFlowCard />

          <TouchableOpacity
            style={styles.statsBtn}
            onPress={() => router.push('/(tabs)/stats' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.statsBtnText}>Voir les statistiques →</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(tabs)/stock/new' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </AuroraBackground>
  )
}

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    scroll: { flex: 1 },
    container: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: 32,
      gap: Spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    greeting: {
      fontSize: 22,
      fontWeight: '400',
      color: colors.text3,
      letterSpacing: -0.5,
    },
    greetingName: {
      fontSize: 26,
      fontFamily: FontFamily.displayItalic,
      fontWeight: '500',
      color: isDark ? colors.accent : colors.text,
      marginTop: -4,
    },
    syncLabel: { fontSize: FontSize.sm, color: colors.text3, marginTop: 4 },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    avatarWrapper: {
      width: 44, height: 44, borderRadius: 99,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { color: '#FFF', fontSize: FontSize.base, fontWeight: '600' },
    notifBtn: {
      width: 40, height: 40, borderRadius: 99,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    notifBadge: {
      position: 'absolute',
      top: -2, right: -2,
      minWidth: 16, height: 16,
      borderRadius: 8,
      backgroundColor: colors.red,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 3,
    },
    notifBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#FFF',
    },
    bentoGrid: { gap: Spacing.md },
    bentoRow: { flexDirection: 'row', gap: Spacing.md },
    bentoCol: { flex: 1, gap: Spacing.md },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    sectionHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: 0, 
      margin: 0
    },
    
    sectionLabel: {
      fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8,
      textTransform: 'uppercase', color: colors.text3,
    },
    sectionLink: { fontSize: FontSize.xs, color: colors.accent },
    statsBtn: { paddingVertical: Spacing.md, alignItems: 'center' },
    statsBtnText: { fontSize: FontSize.sm, fontWeight: '500', color: colors.accent },
    alertList: { gap: Spacing.sm },
    empty: { fontSize: FontSize.sm, color: colors.text3, textAlign: 'center', paddingVertical: Spacing.lg },
    fab: {
      position: 'absolute', bottom: 110, right: Spacing.lg,
      width: 52, height: 52, borderRadius: 99,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12, elevation: 6,
    },
    fabText: { color: '#FFF', fontSize: 28, fontWeight: '300', lineHeight: 32 },
  })
}
