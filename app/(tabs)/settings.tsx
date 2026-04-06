import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, SafeAreaView, Share, Image } from 'react-native'
import { useState, useMemo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../stores/useAuthStore'
import { useTheme } from '../../contexts/ThemeContext'
import AuroraBackground from '../../components/AuroraBackground'
import { Spacing, FontSize, Radius, type ColorScheme } from '../../constants/theme'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAlertPrefs } from '../../hooks/useAlertPrefs'

function SettingRow({ label, value, onPress, danger, toggle, toggleValue, onToggle, icon, colors, isDark }: {
  label: string
  value?: string
  onPress?: () => void
  danger?: boolean
  toggle?: boolean
  toggleValue?: boolean
  onToggle?: (v: boolean) => void
  icon?: React.ComponentProps<typeof Ionicons>['name']
  colors: ColorScheme
  isDark: boolean
}) {
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !toggle}
    >
      {icon && <Ionicons name={icon} size={18} color={danger ? colors.red : colors.text2} style={styles.rowIcon} />}
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: colors.surface2, true: colors.accent }}
          thumbColor="white"
        />
      ) : value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.text3} />
      ) : null}
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()
  const { alertsEnabled, setAlerts } = useAlertPrefs()
  const { colors, isDark, toggleTheme } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const router = useRouter()

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const { data, error } = await supabase
        .from('stock_entries')
        .select('occurred_at, quantity, type, note, variants(name, products(name, sku)), channels(name)')
        .order('occurred_at', { ascending: false })
        .limit(2000)

      if (error) throw new Error(error.message)

      const TYPE_LABELS: Record<string, string> = {
        sale: 'Vente', restock: 'Réassort', adjustment: 'Ajustement',
        transfer: 'Transfert', loss: 'Perte',
      }

      const headers = 'Date,Produit,SKU,Variante,Type,Quantité,Canal,Note'
      const rows = (data ?? []).map((e: any) => {
        const date = new Date(e.occurred_at).toLocaleDateString('fr-FR')
        const product = e.variants?.products?.name ?? ''
        const sku = e.variants?.products?.sku ?? ''
        const variant = e.variants?.name ?? ''
        const type = TYPE_LABELS[e.type] ?? e.type
        const channel = e.channels?.name ?? ''
        const note = (e.note ?? '').replace(/"/g, '""')
        return `${date},"${product}","${sku}","${variant}",${type},${e.quantity},"${channel}","${note}"`
      })

      const csv = [headers, ...rows].join('\n')
      await Share.share({ message: csv, title: 'Export stock Tally' })
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible d\'exporter les données.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert('Se déconnecter', "Tu seras redirigée vers l'écran de connexion.", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: signOut }
    ])
  }

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Réglages</Text>

          {/* Profil */}
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => router.push('/(tabs)/settings/profile' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarWrap}>
              {user?.photo_url ? (
                <Image source={{ uri: user.photo_url }} style={StyleSheet.absoluteFillObject} />
              ) : (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.accent, borderRadius: 99 }]} />
              )}
              {!user?.photo_url && (
                <Text style={styles.avatarText}>
                  {(user?.shopName?.[0] ?? user?.email?.[0] ?? 'T').toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.shopName || 'Ma boutique'}</Text>
              <Text style={styles.profileEmail}>{user?.email ?? '—'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text3} />
          </TouchableOpacity>

          {/* Apparence */}
          <Text style={styles.sectionLabel}>Apparence</Text>
          <View style={styles.card}>
            <SettingRow
              label="Mode sombre"
              icon="moon-outline"
              toggle toggleValue={isDark} onToggle={toggleTheme}
              colors={colors}
              isDark={isDark}
            />
          </View>

          {/* Notifications */}
          <Text style={styles.sectionLabel}>Notifications</Text>
          <View style={styles.card}>
            <SettingRow
              label="Alertes stock bas"
              icon="notifications-outline"
              toggle toggleValue={alertsEnabled} onToggle={setAlerts}
              colors={colors}
              isDark={isDark}
            />
            <View style={styles.separator} />
            <SettingRow
              label="Sync automatique"
              icon="sync-outline"
              toggle toggleValue={syncEnabled} onToggle={setSyncEnabled}
              colors={colors}
              isDark={isDark}
            />
          </View>

          {/* Données */}
          <Text style={styles.sectionLabel}>Données</Text>
          <View style={styles.card}>
            <SettingRow
              label={isExporting ? 'Export en cours...' : 'Exporter en CSV'}
              icon="download-outline"
              onPress={isExporting ? undefined : handleExportCSV}
              colors={colors}
              isDark={isDark}
            />
            <View style={styles.separator} />
            <SettingRow
              label="Importer des produits (CSV)"
              icon="cloud-upload-outline"
              onPress={() => router.push('/(tabs)/settings/import-csv' as any)}
              colors={colors}
              isDark={isDark}
            />
          </View>

          {/* Compte */}
          <Text style={styles.sectionLabel}>Compte</Text>
          <View style={styles.card}>
            <SettingRow label="Email" icon="mail-outline" value={user?.email ?? '—'} colors={colors} isDark={isDark} />
            <View style={styles.separator} />
            <SettingRow label="Version" icon="information-circle-outline" value="1.0.0" colors={colors} isDark={isDark} />
          </View>

          <View style={styles.card}>
            <SettingRow label="Se déconnecter" icon="log-out-outline" onPress={handleSignOut} danger colors={colors} isDark={isDark} />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </AuroraBackground>
  )
}

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'transparent' },
    content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, gap: Spacing.sm },
    title: { fontSize: 26, fontWeight: '400', color: colors.text, letterSpacing: -0.5, marginBottom: Spacing.sm },
    profileCard: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
      padding: Spacing.md, marginBottom: Spacing.sm,
    },
    avatarWrap: {
      width: 48, height: 48, borderRadius: 99,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    avatarText: { color: '#FFF', fontSize: FontSize.lg, fontWeight: '500' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    profileEmail: { fontSize: FontSize.xs, color: colors.text3, marginTop: 2 },
    sectionLabel: {
      fontSize: FontSize.xs, fontWeight: '500', letterSpacing: 0.8,
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
    row: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.md, paddingVertical: 14, gap: Spacing.sm,
    },
    rowIcon: { width: 20 },
    rowLabel: { fontSize: FontSize.base, color: colors.text, flex: 1 },
    rowLabelDanger: { color: colors.red },
    rowValue: { fontSize: FontSize.base, color: colors.text2 },
  })
}
