import { useState, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../contexts/ThemeContext'
import { useStockStore } from '../stores/useStockStore'
import { Spacing, FontSize, Radius, type ColorScheme } from '../constants/theme'

const CHART_H = 90
const BAR_COUNT = 7

type PeriodKey = '7j' | '30j' | '90j'
const PERIODS: { key: PeriodKey; days: number; label: string }[] = [
  { key: '7j',  days: 7,  label: '7 jours' },
  { key: '30j', days: 30, label: '30 jours' },
  { key: '90j', days: 90, label: '90 jours' },
]

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function buildBuckets(days: number) {
  const now = new Date()
  const buckets: { date: Date; label: string; restock: number; out: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    buckets.push({ date: d, label: '', restock: 0, out: 0 })
  }
  return buckets
}

function groupBuckets(
  buckets: { date: Date; label: string; restock: number; out: number }[],
  targetCount: number
) {
  const groupSize = Math.ceil(buckets.length / targetCount)
  const groups: { label: string; restock: number; out: number }[] = []
  for (let i = 0; i < buckets.length; i += groupSize) {
    const slice = buckets.slice(i, i + groupSize)
    const first = slice[0].date
    const label =
      buckets.length <= 7
        ? DAY_NAMES[first.getDay()]
        : `${first.getDate()}/${first.getMonth() + 1}`
    groups.push({
      label,
      restock: slice.reduce((s, b) => s + b.restock, 0),
      out: slice.reduce((s, b) => s + b.out, 0),
    })
  }
  return groups.slice(-targetCount)
}

export default function StockFlowCard() {
  const [periodIdx, setPeriodIdx] = useState(0)
  const { entries } = useStockStore()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  const period = PERIODS[periodIdx]

  const groups = useMemo(() => {
    const buckets = buildBuckets(period.days)
    const start = buckets[0].date

    for (const entry of entries) {
      const d = new Date(entry.occurredAt ?? (entry as any).occurred_at)
      if (d < start) continue
      const dayIdx = Math.floor((d.getTime() - start.getTime()) / 86400000)
      if (dayIdx < 0 || dayIdx >= buckets.length) continue
      if (entry.quantity > 0) buckets[dayIdx].restock += entry.quantity
      else buckets[dayIdx].out += Math.abs(entry.quantity)
    }

    return groupBuckets(buckets, BAR_COUNT)
  }, [entries, period.days])

  const maxVal = Math.max(...groups.map(g => g.restock + g.out), 1)

  // Trend: total this period vs previous
  const { totalIn, totalOut } = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - period.days)
    const prev = new Date(cutoff)
    prev.setDate(prev.getDate() - period.days)

    let totalIn = 0, totalOut = 0
    let prevIn = 0, prevOut = 0
    for (const e of entries) {
      const d = new Date(e.occurredAt ?? (e as any).occurred_at)
      if (d >= cutoff) {
        if (e.quantity > 0) totalIn += e.quantity
        else totalOut += Math.abs(e.quantity)
      } else if (d >= prev) {
        if (e.quantity > 0) prevIn += e.quantity
        else prevOut += Math.abs(e.quantity)
      }
    }
    return { totalIn, totalOut, prevIn, prevOut }
  }, [entries, period.days])

  const net = totalIn - totalOut
  const trendPositive = net >= 0

  const cyclePeriod = () => setPeriodIdx((periodIdx + 1) % PERIODS.length)

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Flux de stock</Text>
          <Text style={[styles.subtitle, { color: trendPositive ? colors.green : colors.red }]}>
            {trendPositive ? '+' : ''}{net}
          </Text>
        </View>
        <TouchableOpacity onPress={cyclePeriod} style={styles.periodBtn} activeOpacity={0.7}>
          <Text style={styles.periodLabel}>{period.label}</Text>
          <Ionicons name="chevron-down" size={11} color={colors.text2} />
        </TouchableOpacity>
      </View>

      {/* Chart */}
      <View style={styles.chartWrap}>
        <View style={styles.barsRow}>
          {groups.map((g, i) => {
            const total = g.restock + g.out
            const barH = (total / maxVal) * CHART_H
            const restockH = total > 0 ? (g.restock / total) * barH : 0
            const outH = barH - restockH
            const pct = Math.round((total / maxVal) * 100)

            return (
              <View key={i} style={styles.barCol}>
                {total > 0 && (
                  <Text style={styles.pctLabel}>{pct}%</Text>
                )}
                <View style={[styles.barWrap, { height: CHART_H }]}>
                  <View style={styles.barStack}>
                    {outH > 0 && (
                      <View style={[styles.barSegment, {
                        height: outH,
                        backgroundColor: isDark ? 'rgba(255,112,112,0.65)' : 'rgba(244,169,168,0.85)',
                        borderTopLeftRadius: restockH > 0 ? 0 : 4,
                        borderTopRightRadius: restockH > 0 ? 0 : 4,
                      }]} />
                    )}
                    {restockH > 0 && (
                      <View style={[styles.barSegment, {
                        height: restockH,
                        backgroundColor: isDark ? 'rgba(80,232,160,0.65)' : 'rgba(124,207,182,0.85)',
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      }]} />
                    )}
                    {total === 0 && (
                      <View style={[styles.barSegment, {
                        height: 3,
                        backgroundColor: colors.border,
                        borderRadius: 2,
                      }]} />
                    )}
                  </View>
                </View>
                <Text style={styles.barLabel}>{g.label}</Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: isDark ? 'rgba(80,232,160,0.65)' : 'rgba(124,207,182,0.85)' }]} />
          <Text style={styles.legendText}>Entrées</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: isDark ? 'rgba(255,112,112,0.65)' : 'rgba(244,169,168,0.85)' }]} />
          <Text style={styles.legendText}>Sorties</Text>
        </View>
      </View>
    </View>
  )
}

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      gap: Spacing.md,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    title: {
      fontSize: FontSize.base,
      fontWeight: '600',
      color: colors.text,
    },
    subtitle: {
      fontSize: FontSize.xs,
      fontWeight: '500',
      marginTop: 2,
    },
    periodBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 5,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodLabel: {
      fontSize: FontSize.xs,
      color: colors.text2,
      fontWeight: '500',
    },
    chartWrap: {
      borderRadius: Radius.md,
      overflow: 'hidden',
      paddingTop: Spacing.sm,
    },
    barsRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingBottom: Spacing.xs,
    },
    barCol: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    pctLabel: {
      fontSize: 9,
      fontWeight: '600',
      color: colors.text3,
    },
    barWrap: {
      width: '72%',
      justifyContent: 'flex-end',
    },
    barStack: {
      width: '100%',
      overflow: 'hidden',
      borderRadius: 4,
    },
    barSegment: {
      width: '100%',
    },
    barLabel: {
      fontSize: 9,
      color: colors.text3,
      fontWeight: '500',
    },
    legend: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: FontSize.xs,
      color: colors.text3,
    },
  })
}
