import { useEffect } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { useChannelStore } from '../../stores/useChannelStore'
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme'
import type { Channel } from '../../types'

const CHANNEL_ICONS: Record<string, string> = {
  etsy: 'E', woocommerce: 'W', physical: '◻', market: '⊕', other: '+',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

function ChannelCard({ channel, onPress, onDelete }: { channel: Channel; onPress: () => void; onDelete: () => void }) {
  const isManual = ['physical', 'market', 'other'].includes(channel.type)
  const isConnected = !isManual && !!channel.apiToken
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.icon, isManual && styles.iconGray]}>
        <Text style={[styles.iconText, isManual && styles.iconTextGray]}>{CHANNEL_ICONS[channel.type] ?? '+'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{channel.name}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isManual ? styles.dotGray : isConnected ? styles.dotGreen : styles.dotOrange]} />
          <Text style={styles.statusText}>
            {isManual ? 'Manuel' : isConnected ? 'Connecté' : 'Non configuré'}
            {channel.lastSyncedAt && !isManual ? ` · sync ${timeAgo(channel.lastSyncedAt)}` : ''}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.deleteBtn}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

export default function ChannelsScreen() {
  const router = useRouter()
  const { channels, fetchChannels, deleteChannel, isLoading } = useChannelStore()

  useEffect(() => { fetchChannels() }, [])

  const handleDelete = (channel: Channel) => {
    Alert.alert(`Supprimer ${channel.name}`, "Ce canal sera désactivé.", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteChannel(channel.id) }
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Canaux</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/channels/new' as any)}>
          <Text style={styles.addBtn}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchChannels} tintColor={Colors.text3} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucun canal</Text>
            <Text style={styles.emptyText}>Ajoute tes canaux de vente pour suivre ton stock</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/channels/new' as any)}>
              <Text style={styles.emptyBtnText}>Ajouter un canal</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <ChannelCard channel={item} onPress={() => {}} onDelete={() => handleDelete(item)} />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  title: { fontSize: 22, fontWeight: '400', color: Colors.text, letterSpacing: -0.5 },
  addBtn: { fontSize: FontSize.base, fontWeight: '500', color: Colors.accent },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: Spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface2, borderRadius: Radius.sm, padding: Spacing.md },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconGray: { backgroundColor: Colors.border },
  iconText: { color: 'white', fontSize: FontSize.sm, fontWeight: '500' },
  iconTextGray: { color: Colors.text2 },
  info: { flex: 1 },
  name: { fontSize: FontSize.base, fontWeight: '500', color: Colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 5, height: 5, borderRadius: 99 },
  dotGreen: { backgroundColor: Colors.green },
  dotOrange: { backgroundColor: Colors.orange },
  dotGray: { backgroundColor: Colors.text3 },
  statusText: { fontSize: FontSize.xs, color: Colors.text3 },
  deleteBtn: { fontSize: FontSize.xs, color: Colors.text3, padding: 4 },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '400', color: Colors.text },
  emptyText: { fontSize: FontSize.sm, color: Colors.text3, textAlign: 'center', paddingHorizontal: Spacing.xl },
  emptyBtn: { backgroundColor: Colors.accent, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: 12, marginTop: Spacing.sm },
  emptyBtnText: { color: 'white', fontSize: FontSize.base, fontWeight: '500' },
})
