import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, SafeAreaView
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useTheme } from '../../../contexts/ThemeContext'
import AuroraBackground from '../../../components/AuroraBackground'
import { Spacing, FontSize, Radius, type ColorScheme } from '../../../constants/theme'

type Entry = {
  id: string
  occurred_at: string
  quantity: number
  type: string
  note?: string
  variants: { name: string; products: { name: string } } | null
  channels: { name: string } | null
}

const FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'sale', label: 'Ventes' },
  { key: 'restock', label: 'Réassorts' },
  { key: 'adjustment', label: 'Ajustements' },
  { key: 'transfer', label: 'Transferts' },
  { key: 'loss', label: 'Pertes' },
]

const TYPE_LABELS: Record<string, string> = {
  sale: 'Vente', restock: 'Réassort', adjustment: 'Ajustement',
  transfer: 'Transfert', loss: 'Perte',
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (date.toDateString() === yesterday.toDateString()) return 'Hier'
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(entries: Entry[]) {
  const groups: { date: string; items: Entry[] }[] = []
  const seen = new Map<string, number>()
  for (const entry of entries) {
    const key = new Date(entry.occurred_at).toDateString()
    if (seen.has(key)) {
      groups[seen.get(key)!].items.push(entry)
    } else {
      seen.set(key, groups.length)
      groups.push({ date: formatDate(entry.occurred_at), items: [entry] })
    }
  }
  return groups
}

export default function StockHistoryScreen() {
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])
  const [filter, setFilter] = useState('all')
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    let query = supabase
      .from('stock_entries')
      .select('id, occurred_at, quantity, type, note, variants(name, products(name)), channels(name)')
      .order('occurred_at', { ascending: false })
      .limit(200)
    if (filter !== 'all') query = query.eq('type', filter)
    const { data } = await query
    setEntries((data as any[]) ?? [])
    setIsLoading(false)
  }, [filter])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const grouped = groupByDate(entries)

  const typeColor = (type: string) => {
    const map: Record<string, string> = {
      sale: colors.red, loss: colors.red, restock: colors.green,
      adjustment: colors.orange, transfer: colors.text3,
    }
    return map[type] ?? colors.text3
  }

  const renderItem = ({ item }: { item: { date: string; items: Entry[] } }) => (
    <View style={styles.group}>
      <Text style={styles.dateLabel}>{item.date}</Text>
      <View style={styles.card}>
        {item.items.map((entry, i) => {
          const color = typeColor(entry.type)
          const isPositive = entry.quantity > 0
          const productName = (entry.variants as any)?.products?.name ?? 'Produit inconnu'
          const variantName = (entry.variants as any)?.name
          const channelName = (entry.channels as any)?.name
          const time = new Date(entry.occurred_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

          return (
            <View key={entry.id}>
              {i > 0 && <View style={styles.separator} />}
              <View style={styles.entryRow}>
                <View style={[styles.typeDot, { backgroundColor: color }]} />
                <View style={styles.entryInfo}>
                  <Text style={styles.entryProduct} numberOfLines={1}>{productName}</Text>
                  <Text style={styles.entrySub} numberOfLines={1}>
                    {TYPE_LABELS[entry.type] ?? entry.type}
                    {variantName ? ` · ${variantName}` : ''}
                    {channelName ? ` · ${channelName}` : ''}
                    {' · '}{time}
                  </Text>
                  {entry.note ? <Text style={styles.entryNote} numberOfLines={1}>{entry.note}</Text> : null}
                </View>
                <Text style={[styles.entryQty, { color }]}>
                  {isPositive ? '+' : ''}{entry.quantity}
                </Text>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Historique</Text>
          <View style={{ width: 60 }} />
        </View>

        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterRow}
          style={styles.filterList}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, filter === item.key && styles.chipActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.chipText, filter === item.key && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        <FlatList
          data={grouped}
          keyExtractor={(item) => item.date}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchHistory} tintColor={colors.text3} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Aucun mouvement trouvé</Text>
              </View>
            ) : null
          }
          renderItem={renderItem}
        />
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
    filterList: { flexGrow: 0 },
    filterRow: {
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
      gap: Spacing.sm, alignItems: 'center',
    },
    chip: {
      paddingHorizontal: Spacing.md, paddingVertical: 7,
      borderRadius: Radius.full, borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface,
    },
    chipActive: {
      backgroundColor: isDark ? 'rgba(155,127,212,0.2)' : colors.accent,
      borderColor: isDark ? 'rgba(155,127,212,0.4)' : colors.accent,
    },
    chipText: { fontSize: FontSize.sm, fontWeight: '500', color: colors.text2 },
    chipTextActive: { color: isDark ? '#C4ADEC' : '#FFF' },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
    group: { gap: Spacing.xs },
    dateLabel: {
      fontSize: FontSize.xs, fontWeight: '500', letterSpacing: 0.6,
      textTransform: 'uppercase', color: colors.text3,
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
    entryRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.md,
    },
    typeDot: { width: 8, height: 8, borderRadius: 99, flexShrink: 0 },
    entryInfo: { flex: 1, gap: 2 },
    entryProduct: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    entrySub: { fontSize: FontSize.xs, color: colors.text3 },
    entryNote: { fontSize: FontSize.xs, color: colors.text2, fontStyle: 'italic' },
    entryQty: { fontSize: FontSize.base, fontWeight: '500', fontVariant: ['tabular-nums'], minWidth: 36, textAlign: 'right' },
    empty: { paddingTop: 60, alignItems: 'center' },
    emptyText: { fontSize: FontSize.base, color: colors.text3 },
  })
}
