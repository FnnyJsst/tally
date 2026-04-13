import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Alert, SafeAreaView
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useChannelStore } from '../../stores/useChannelStore'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import AuroraBackground from '../../components/AuroraBackground'
import { ChannelLogo, BRAND_CHANNEL_TYPES } from '../../components/ChannelLogo'
import { Spacing, FontSize, Radius, type ColorScheme } from '../../constants/theme'
import type { Channel } from '../../types/types'

const CHANNEL_ICONS: Record<string, string> = {
  physical: '◻', market: '⊕', other: '+',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

type SyncLog = {
  status: 'ok' | 'error'
  error_message?: string
  created_at: string
  items_synced?: number
}

function ChannelCard({ channel, syncLog, onDelete, colors, styles }: {
  channel: Channel
  syncLog?: SyncLog | null
  onDelete: () => void
  colors: ColorScheme
  styles: ReturnType<typeof makeStyles>
}) {
  const isManual = ['physical', 'market', 'other'].includes(channel.type)
  const isConnected = !isManual && !!channel.apiToken
  const hasSyncError = syncLog?.status === 'error'

  const isBrand = BRAND_CHANNEL_TYPES.includes(channel.type as any)

  return (
    <View style={styles.card}>
      {isBrand ? (
        <ChannelLogo type={channel.type as any} size={40} />
      ) : (
        <View style={[styles.icon, isManual && styles.iconGray]}>
          <Text style={[styles.iconText, isManual && styles.iconTextGray]}>
            {CHANNEL_ICONS[channel.type] ?? '+'}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{channel.name}</Text>
        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            isManual ? styles.dotGray :
            hasSyncError ? styles.dotRed :
            isConnected ? styles.dotGreen : styles.dotOrange
          ]} />
          <Text style={[styles.statusText, hasSyncError && styles.statusTextError]}>
            {isManual ? 'Manuel' : hasSyncError ? 'Erreur de sync' : isConnected ? 'Connecté' : 'Non configuré'}
            {channel.lastSyncedAt && !isManual && !hasSyncError ? ` · sync ${timeAgo(channel.lastSyncedAt)}` : ''}
          </Text>
        </View>
        {hasSyncError && syncLog?.error_message && (
          <Text style={styles.errorMessage} numberOfLines={2}>{syncLog.error_message}</Text>
        )}
        {syncLog?.status === 'ok' && (syncLog.items_synced ?? 0) > 0 && (
          <Text style={styles.syncInfo}>
            {syncLog.items_synced} commande{(syncLog.items_synced ?? 0) > 1 ? 's' : ''} sync. {timeAgo(syncLog.created_at)}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Ionicons name="close-circle-outline" size={20} color={colors.text3} />
      </TouchableOpacity>
    </View>
  )
}

export default function ChannelsScreen() {
  const router = useRouter()
  const { channels, fetchChannels, deleteChannel, isLoading } = useChannelStore()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])
  const [syncLogs, setSyncLogs] = useState<Record<string, SyncLog>>({})

  const loadSyncLogs = useCallback(async () => {
    const { data } = await supabase
      .from('sync_logs')
      .select('channel_id, status, error_message, created_at, items_synced')
      .order('created_at', { ascending: false })
    if (!data) return
    const map: Record<string, SyncLog> = {}
    for (const log of data as any[]) {
      if (!map[log.channel_id]) {
        map[log.channel_id] = {
          status: log.status, error_message: log.error_message,
          created_at: log.created_at, items_synced: log.items_synced,
        }
      }
    }
    setSyncLogs(map)
  }, [])

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchChannels(), loadSyncLogs()])
  }, [fetchChannels, loadSyncLogs])

  useEffect(() => { handleRefresh() }, [])

  const handleDelete = (channel: Channel) => {
    Alert.alert(`Supprimer ${channel.name}`, "Ce canal sera désactivé.", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteChannel(channel.id) }
    ])
  }

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Canaux</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/(tabs)/channels/new' as any)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={channels}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.text3} />
            }
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="git-network-outline" size={48} color={colors.text3} />
                <Text style={styles.emptyTitle}>Aucun canal</Text>
                <Text style={styles.emptyText}>Ajoute tes canaux de vente pour suivre ton stock</Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => router.push('/(tabs)/channels/new' as any)}
                >
                  <Text style={styles.emptyBtnText}>Ajouter un canal</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <ChannelCard
                channel={item}
                syncLog={syncLogs[item.id] ?? null}
                onDelete={() => handleDelete(item)}
                colors={colors}
                styles={styles}
              />
            )}
          />
        </View>
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
      paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, marginBottom: Spacing.lg,
    },
    title: { fontSize: 26, fontWeight: '400', color: colors.text, letterSpacing: -0.5 },
    addBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.accent, borderRadius: Radius.full,
      paddingHorizontal: Spacing.md, paddingVertical: 8,
    },
    addBtnText: { fontSize: FontSize.sm, fontWeight: '500', color: '#FFF' },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: 160, gap: Spacing.sm },
    card: {
      flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
      padding: Spacing.md,
    },
    icon: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    iconGray: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface2,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
    },
    iconText: { color: '#FFF', fontSize: FontSize.base, fontWeight: '500' },
    iconTextGray: { color: colors.text2 },
    info: { flex: 1, gap: 2 },
    name: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    statusDot: { width: 6, height: 6, borderRadius: 99 },
    dotGreen: { backgroundColor: colors.green },
    dotOrange: { backgroundColor: colors.orange },
    dotGray: { backgroundColor: colors.text3 },
    dotRed: { backgroundColor: colors.red },
    statusText: { fontSize: FontSize.xs, color: colors.text3 },
    statusTextError: { color: colors.red },
    errorMessage: { fontSize: FontSize.xs, color: colors.red, marginTop: 2, lineHeight: 16 },
    syncInfo: { fontSize: FontSize.xs, color: colors.green, marginTop: 2 },
    empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: '400', color: colors.text },
    emptyText: { fontSize: FontSize.sm, color: colors.text3, textAlign: 'center', paddingHorizontal: Spacing.xl },
    emptyBtn: {
      backgroundColor: colors.accent, borderRadius: Radius.full,
      paddingHorizontal: Spacing.xl, paddingVertical: 12, marginTop: Spacing.sm,
    },
    emptyBtnText: { color: '#FFF', fontSize: FontSize.base, fontWeight: '500' },
  })
}
