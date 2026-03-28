import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native'
import { useState } from 'react'
import { useAuthStore } from '../../stores/useAuthStore'
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme'

function SettingRow({ label, value, onPress, danger, toggle, toggleValue, onToggle }: {
  label: string
  value?: string
  onPress?: () => void
  danger?: boolean
  toggle?: boolean
  toggleValue?: boolean
  onToggle?: (v: boolean) => void
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !toggle}
    >
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ true: Colors.accent }}
          thumbColor="white"
        />
      ) : value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : onPress ? (
        <Text style={styles.chevron}>›</Text>
      ) : null}
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [syncEnabled, setSyncEnabled] = useState(true)

  const handleSignOut = () => {
    Alert.alert('Se déconnecter', 'Tu seras redirigée vers l\'écran de connexion.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: signOut }
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profil */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.shopName?.[0]?.toUpperCase() ?? 'T'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.shopName ?? '—'}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? '—'}</Text>
        </View>
      </View>

      {/* Notifications */}
      <Text style={styles.sectionLabel}>Notifications</Text>
      <View style={styles.card}>
        <SettingRow
          label="Alertes stock bas"
          toggle
          toggleValue={alertsEnabled}
          onToggle={setAlertsEnabled}
        />
        <View style={styles.separator} />
        <SettingRow
          label="Sync automatique"
          toggle
          toggleValue={syncEnabled}
          onToggle={setSyncEnabled}
        />
      </View>

      {/* Données */}
      <Text style={styles.sectionLabel}>Données</Text>
      <View style={styles.card}>
        <SettingRow
          label="Exporter en CSV"
          onPress={() => Alert.alert('Export CSV', 'Fonctionnalité à venir dans une prochaine version.')}
        />
      </View>

      {/* Compte */}
      <Text style={styles.sectionLabel}>Compte</Text>
      <View style={styles.card}>
        <SettingRow label="Email" value={user?.email ?? '—'} />
        <View style={styles.separator} />
        <SettingRow label="Version" value="1.0.0" />
      </View>

      <View style={styles.card}>
        <SettingRow label="Se déconnecter" onPress={handleSignOut} danger />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingTop: 60, paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface2, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 99,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: 'white', fontSize: FontSize.lg, fontWeight: '500' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: FontSize.base, fontWeight: '500', color: Colors.text },
  profileEmail: { fontSize: FontSize.xs, color: Colors.text3, marginTop: 2 },
  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: '500', letterSpacing: 0.7,
    textTransform: 'uppercase', color: Colors.text3, marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  separator: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  rowLabel: { fontSize: FontSize.base, color: Colors.text },
  rowLabelDanger: { color: Colors.red },
  rowValue: { fontSize: FontSize.base, color: Colors.text2 },
  chevron: { fontSize: FontSize.lg, color: Colors.text3 },
})
