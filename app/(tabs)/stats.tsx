import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, SafeAreaView
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'
import AuroraBackground from '../../components/AuroraBackground'
import { Spacing, FontSize, Radius, FontFamily, type ColorScheme } from '../../constants/theme'

type Period = 7 | 30 | 90
type DayStat = { date: string; sales: number; restocks: number }
type TopProduct = { name: string; sold: number }
type ChannelStat = { name: string; sold: number }

const PERIODS: { label: string; value: Period }[] = [
  { label: '7 jours', value: 7 },
  { label: '30 jours', value: 30 },
  { label: '90 jours', value: 90 },
]

function pad(n: number) { return String(n).padStart(2, '0') }
function toDateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

function WeeklyBars({ data, period, colors, isDark }: { data: DayStat[]; period: Period; colors: ColorScheme; isDark: boolean }) {
  if (!data.length) return null
  type Bar = { label: string; sales: number; restocks: number }
  let bars: Bar[] = []

  if (period === 7) {
    bars = data.map(d => ({
      label: new Date(d.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short' }),
      sales: Math.abs(d.sales), restocks: d.restocks,
    }))
  } else {
    const weeks: Record<string, Bar> = {}
    data.forEach(d => {
      const dt = new Date(d.date + 'T12:00:00')
      const monday = new Date(dt)
      monday.setDate(dt.getDate() - ((dt.getDay() + 6) % 7))
      const key = toDateStr(monday)
      if (!weeks[key]) weeks[key] = { label: `${monday.getDate()}/${monday.getMonth() + 1}`, sales: 0, restocks: 0 }
      weeks[key].sales += Math.abs(d.sales)
      weeks[key].restocks += d.restocks
    })
    bars = Object.values(weeks)
  }

  const maxVal = Math.max(...bars.map(b => b.sales + b.restocks), 1)
  const salesColor = colors.red
  const restocksColor = colors.green

  return (
    <View style={{ padding: Spacing.md, gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 4 }}>
        {bars.map((b, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'flex-end', height: 80, gap: 2 }}>
              {b.restocks > 0 && (
                <View style={{ width: '70%', borderRadius: 3, minHeight: 2, height: Math.max((b.restocks / maxVal) * 80, 2), backgroundColor: restocksColor }} />
              )}
              {b.sales > 0 && (
                <View style={{ width: '70%', borderRadius: 3, minHeight: 2, height: Math.max((b.sales / maxVal) * 80, 2), backgroundColor: salesColor }} />
              )}
            </View>
            <Text style={{ fontSize: 9, color: colors.text3, textAlign: 'center' }}>{b.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.md, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: salesColor }} />
          <Text style={{ fontSize: FontSize.xs, color: colors.text3 }}>Ventes</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: restocksColor }} />
          <Text style={{ fontSize: FontSize.xs, color: colors.text3 }}>Réassorts</Text>
        </View>
      </View>
    </View>
  )
}

export default function StatsScreen() {
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])
  const [period, setPeriod] = useState<Period>(30)
  const [isLoading, setIsLoading] = useState(true)
  const [totalSales, setTotalSales] = useState(0)
  const [totalRestocks, setTotalRestocks] = useState(0)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [channelStats, setChannelStats] = useState<ChannelStat[]>([])
  const [dayStats, setDayStats] = useState<DayStat[]>([])

  const load = useCallback(async () => {
    setIsLoading(true)
    const since = new Date()
    since.setDate(since.getDate() - period)
    const { data } = await supabase
      .from('stock_entries')
      .select('occurred_at, quantity, type, variants(name, products(name)), channels(name)')
      .gte('occurred_at', since.toISOString())
      .order('occurred_at', { ascending: true })

    if (!data) { setIsLoading(false); return }

    let sales = 0, restocks = 0
    const productMap: Record<string, number> = {}
    const channelMap: Record<string, number> = {}
    const dayMap: Record<string, DayStat> = {}

    for (let i = 0; i < period; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (period - 1 - i))
      const key = toDateStr(d)
      dayMap[key] = { date: key, sales: 0, restocks: 0 }
    }

    for (const entry of data as any[]) {
      const dateKey = toDateStr(new Date(entry.occurred_at))
      const productName = entry.variants?.products?.name ?? 'Inconnu'
      const channelName = entry.channels?.name ?? 'Sans canal'
      if (entry.type === 'sale' || (entry.type !== 'restock' && entry.quantity < 0)) {
        sales += Math.abs(entry.quantity)
        productMap[productName] = (productMap[productName] ?? 0) + Math.abs(entry.quantity)
        channelMap[channelName] = (channelMap[channelName] ?? 0) + Math.abs(entry.quantity)
        if (dayMap[dateKey]) dayMap[dateKey].sales += entry.quantity
      } else if (entry.type === 'restock') {
        restocks += entry.quantity
        if (dayMap[dateKey]) dayMap[dateKey].restocks += entry.quantity
      }
    }

    setTotalSales(sales)
    setTotalRestocks(restocks)
    setDayStats(Object.values(dayMap))
    setTopProducts(Object.entries(productMap).map(([name, sold]) => ({ name, sold })).sort((a, b) => b.sold - a.sold).slice(0, 5))
    setChannelStats(Object.entries(channelMap).map(([name, sold]) => ({ name, sold })).sort((a, b) => b.sold - a.sold))
    setIsLoading(false)
  }, [period])

  useEffect(() => { load() }, [load])

  const maxProduct = topProducts[0]?.sold ?? 1

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Statistiques</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.value}
              style={[styles.periodBtn, period === p.value && styles.periodBtnActive]}
              onPress={() => setPeriod(p.value)}
            >
              <Text style={[styles.periodText, period === p.value && styles.periodTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={colors.text3} />}
        >
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { flex: 1 }]}>
              <Text style={styles.kpiValue}>{totalSales}</Text>
              <Text style={styles.kpiLabel}>Unités vendues</Text>
            </View>
            <View style={[styles.kpiCard, { flex: 1 }]}>
              <Text style={[styles.kpiValue, { color: colors.green }]}>{totalRestocks}</Text>
              <Text style={styles.kpiLabel}>Réassorts</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Activité</Text>
          <View style={styles.card}>
            {dayStats.length > 0
              ? <WeeklyBars data={dayStats} period={period} colors={colors} isDark={isDark} />
              : <Text style={styles.empty}>Aucune donnée</Text>}
          </View>

          {topProducts.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Top produits vendus</Text>
              <View style={styles.card}>
                {topProducts.map((p, i) => (
                  <View key={p.name}>
                    {i > 0 && <View style={styles.separator} />}
                    <View style={styles.rankRow}>
                      <Text style={styles.rankNum}>{i + 1}</Text>
                      <View style={styles.rankInfo}>
                        <Text style={styles.rankName} numberOfLines={1}>{p.name}</Text>
                        <View style={styles.rankBarWrap}>
                          <View style={[styles.rankBar, { width: `${(p.sold / maxProduct) * 100}%` }]} />
                        </View>
                      </View>
                      <Text style={styles.rankValue}>{p.sold}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {channelStats.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Ventes par canal</Text>
              <View style={styles.card}>
                {channelStats.map((c, i) => (
                  <View key={c.name}>
                    {i > 0 && <View style={styles.separator} />}
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>{c.name}</Text>
                      <Text style={styles.infoValue}>{c.sold} unités</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {!isLoading && totalSales === 0 && totalRestocks === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>Aucun mouvement</Text>
              <Text style={styles.emptyStateText}>Enregistre des ventes pour voir tes statistiques</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </AuroraBackground>
  )
}

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    topbar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    },
    backBtn: { fontSize: FontSize.base, color: colors.text2, width: 60 },
    topbarTitle: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    periodRow: {
      flexDirection: 'row', gap: Spacing.sm,
      paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
    },
    periodBtn: {
      flex: 1, paddingVertical: 8, borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface,
      alignItems: 'center',
    },
    periodBtnActive: {
      backgroundColor: isDark ? 'rgba(155,127,212,0.2)' : colors.accent,
      borderColor: isDark ? 'rgba(155,127,212,0.4)' : colors.accent,
    },
    periodText: { fontSize: FontSize.sm, fontWeight: '500', color: colors.text2 },
    periodTextActive: { color: isDark ? '#C4ADEC' : '#FFF' },
    content: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
    kpiRow: { flexDirection: 'row', gap: Spacing.sm },
    kpiCard: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
      padding: Spacing.md, gap: 4,
    },
    kpiValue: { fontSize: 28, fontFamily: FontFamily.display, color: colors.text, letterSpacing: -0.5 },
    kpiLabel: { fontSize: FontSize.xs, color: colors.text3, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionLabel: {
      fontSize: FontSize.xs, fontWeight: '500', letterSpacing: 0.7,
      textTransform: 'uppercase', color: colors.text3, marginTop: Spacing.sm,
    },
    card: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
      overflow: 'hidden',
    },
    separator: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
      marginHorizontal: Spacing.md,
    },
    rankRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    },
    rankNum: { fontSize: FontSize.sm, color: colors.text3, width: 16, textAlign: 'center' },
    rankInfo: { flex: 1, gap: 5 },
    rankName: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    rankBarWrap: {
      height: 4,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface2,
      borderRadius: 99, overflow: 'hidden',
    },
    rankBar: { height: '100%', backgroundColor: colors.accent, borderRadius: 99 },
    rankValue: { fontSize: FontSize.base, fontWeight: '500', color: colors.text, fontVariant: ['tabular-nums'] },
    infoRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    },
    infoLabel: { fontSize: FontSize.base, color: colors.text },
    infoValue: { fontSize: FontSize.base, color: colors.text2 },
    empty: { padding: Spacing.lg, textAlign: 'center', color: colors.text3, fontSize: FontSize.sm },
    emptyState: { paddingTop: 40, alignItems: 'center', gap: Spacing.sm },
    emptyStateTitle: { fontSize: FontSize.lg, color: colors.text, fontWeight: '400' },
    emptyStateText: { fontSize: FontSize.sm, color: colors.text3, textAlign: 'center' },
  })
}
