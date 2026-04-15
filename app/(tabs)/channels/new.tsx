import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator, SafeAreaView
} from 'react-native'
import { useRouter } from 'expo-router'
import { useChannelStore } from '../../../stores/useChannelStore'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useEtsyOAuth } from '../../../hooks/useEtsyOAuth'
import { useShopifyOAuth } from '../../../hooks/useShopifyOAuth'
import { useTheme } from '../../../contexts/ThemeContext'
import AuroraBackground from '../../../components/AuroraBackground'
import { ChannelLogo, BRAND_CHANNEL_TYPES } from '../../../components/ChannelLogo'
import { Spacing, FontSize, Radius, type ColorScheme } from '../../../constants/theme'
import type { ChannelType } from '../../../types/types'

const CHANNEL_TYPES: { type: ChannelType; label: string; icon: string; manual: boolean }[] = [
  { type: 'etsy',        label: 'Etsy',             icon: 'E',  manual: false },
  { type: 'shopify',     label: 'Shopify',          icon: 'S',  manual: false },
  { type: 'woocommerce', label: 'WooCommerce',       icon: 'W',  manual: false },
  { type: 'physical',    label: 'Boutique physique', icon: '🏬', manual: true },
  { type: 'market',      label: 'Marché / Salon',    icon: '🎪', manual: true },
  { type: 'other',       label: 'Autre',             icon: '+',  manual: true },
]

export default function NewChannelScreen() {
  const router = useRouter()
  const { createChannel } = useChannelStore()
  const { user } = useAuthStore()
  const { connectEtsy, isLoading: etsyLoading, error: etsyError } = useEtsyOAuth()
  const { connectShopify, isLoading: shopifyLoading, error: shopifyError } = useShopifyOAuth()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  const [selectedType, setSelectedType] = useState<ChannelType | null>(null)
  const [name, setName] = useState('')
  const [customEmoji, setCustomEmoji] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [shopifyDomain, setShopifyDomain] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async () => {
    if (!selectedType) { Alert.alert('Champ manquant', 'Sélectionne un type de canal.'); return }

    if (selectedType === 'etsy') {
      const ok = await connectEtsy()
      if (ok) router.back()
      return
    }

    if (selectedType === 'shopify') {
      if (!shopifyDomain.trim()) { Alert.alert('Champ manquant', 'Entre le domaine de ta boutique Shopify.'); return }
      const ok = await connectShopify(shopifyDomain.trim())
      if (ok) router.back()
      return
    }

    if (!name.trim()) { Alert.alert('Champ manquant', 'Donne un nom à ce canal.'); return }
    if (selectedType === 'woocommerce' && !siteUrl.trim()) {
      Alert.alert('Champ manquant', "L'URL de ton site WooCommerce est obligatoire.")
      return
    }

    const emoji = customEmoji.trim()
    const finalName = selectedType === 'other' && emoji ? `${emoji} ${name.trim()}` : name.trim()

    setIsLoading(true)
    const { error } = await createChannel({
      user_id: user?.id, name: finalName, type: selectedType,
      api_token: apiToken.trim() || undefined,
      site_url: selectedType === 'woocommerce' ? siteUrl.trim() : undefined,
      is_active: true,
    } as any)
    setIsLoading(false)
    if (error) { Alert.alert('Erreur', error); return }
    router.back()
  }

  const loading = isLoading || etsyLoading || shopifyLoading

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Ajouter un canal</Text>
          <TouchableOpacity onPress={handleCreate} disabled={loading}>
            {loading
              ? <ActivityIndicator size="small" color={colors.accent} />
              : <Text style={styles.saveBtn}>Ajouter</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Type de canal</Text>
          <View style={styles.typeList}>
            {CHANNEL_TYPES.map((t, i) => (
              <View key={t.type}>
                {i > 0 && <View style={styles.separator} />}
                <TouchableOpacity
                  style={[styles.typeRow, selectedType === t.type && styles.typeRowActive]}
                  onPress={() => { setSelectedType(t.type); if (!name) setName(t.label) }}
                >
                  {BRAND_CHANNEL_TYPES.includes(t.type) ? (
                    <ChannelLogo type={t.type} size={36} />
                  ) : (
                    <View style={[
                      styles.typeIcon,
                      t.manual && styles.typeIconManual,
                      selectedType === t.type && t.type !== 'physical' && t.type !== 'market' && styles.typeIconActive,
                    ]}>
                      <Text style={[
                        styles.typeIconText,
                        t.icon.codePointAt(0)! > 255 ? styles.typeIconEmoji : (
                          (!t.manual || selectedType === t.type) && styles.typeIconTextWhite
                        ),
                      ]}>
                        {t.type === 'other' && selectedType === t.type && customEmoji ? customEmoji : t.icon}
                      </Text>
                    </View>
                  )}
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeLabel}>{t.label}</Text>
                    <Text style={styles.typeSub}>
                      {t.type === 'etsy' ? 'Connexion OAuth — ouvrira etsy.com'
                        : t.type === 'shopify' ? 'Connexion OAuth — ouvrira ta boutique'
                        : t.manual ? 'Saisie manuelle' : 'Clé API'}
                    </Text>
                  </View>
                  {selectedType === t.type && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {selectedType === 'etsy' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                En appuyant sur "Ajouter", tu seras redirigée vers etsy.com pour autoriser Tally à accéder à tes commandes.
              </Text>
              {etsyError && <Text style={styles.errorText}>{etsyError}</Text>}
            </View>
          )}

          {selectedType === 'shopify' && (
            <>
              <Text style={styles.sectionLabel}>Domaine de la boutique</Text>
              <View style={styles.card}>
                <TextInput
                  style={styles.input}
                  value={shopifyDomain}
                  onChangeText={setShopifyDomain}
                  placeholder="maboutique.myshopify.com"
                  placeholderTextColor={colors.text3}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
              <Text style={styles.hint}>
                Entre l'URL de ta boutique Shopify.{'\n'}
                Tu seras redirigée vers Shopify pour autoriser l'accès.
              </Text>
              {shopifyError && (
                <View style={styles.infoBox}>
                  <Text style={styles.errorText}>{shopifyError}</Text>
                </View>
              )}
            </>
          )}

          {selectedType && selectedType !== 'etsy' && selectedType !== 'shopify' && (
            <>
              {selectedType === 'other' && (
                <>
                  <Text style={styles.sectionLabel}>Icône (emoji)</Text>
                  <View style={[styles.card, { alignSelf: 'flex-start' }]}>
                    <TextInput
                      style={styles.emojiInput}
                      value={customEmoji}
                      onChangeText={setCustomEmoji}
                      placeholder="🎨"
                      placeholderTextColor={colors.text3}
                      maxLength={8}
                    />
                  </View>
                </>
              )}
              <Text style={styles.sectionLabel}>Nom</Text>
              <View style={styles.card}>
                <TextInput
                  style={styles.input} value={name} onChangeText={setName}
                  placeholder="Nom du canal" placeholderTextColor={colors.text3}
                />
              </View>

              {selectedType === 'woocommerce' && (
                <>
                  <Text style={styles.sectionLabel}>URL du site *</Text>
                  <View style={styles.card}>
                    <TextInput
                      style={styles.input} value={siteUrl} onChangeText={setSiteUrl}
                      placeholder="https://maboutique.com" placeholderTextColor={colors.text3}
                      autoCapitalize="none" autoCorrect={false} keyboardType="url"
                    />
                  </View>
                  <Text style={styles.sectionLabel}>Clé API (ck_… : cs_…) *</Text>
                  <View style={styles.card}>
                    <TextInput
                      style={styles.input} value={apiToken} onChangeText={setApiToken}
                      placeholder="ck_xxx:cs_xxx" placeholderTextColor={colors.text3}
                      autoCapitalize="none" autoCorrect={false} secureTextEntry
                    />
                  </View>
                  <Text style={styles.hint}>
                    Crée une clé dans WooCommerce › Réglages › Avancé › REST API{'\n'}
                    Colle la Consumer Key et Consumer Secret séparées par ":"
                  </Text>
                </>
              )}
            </>
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
    backBtn: { fontSize: FontSize.base, color: colors.text2 },
    topbarTitle: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    saveBtn: { fontSize: FontSize.base, fontWeight: '500', color: colors.accent },
    form: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
    sectionLabel: {
      fontSize: FontSize.xs, fontWeight: '500', letterSpacing: 0.7,
      textTransform: 'uppercase', color: colors.text3, marginTop: Spacing.sm,
    },
    typeList: {
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
    typeRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md,
    },
    typeRowActive: {
      backgroundColor: isDark ? 'rgba(155,127,212,0.1)' : colors.surface2,
    },
    typeIcon: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: isDark ? colors.accent : colors.accent,
      alignItems: 'center', justifyContent: 'center',
    },
    typeIconManual: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
    },
    typeIconActive: { backgroundColor: colors.accent },
    typeIconText: { fontSize: FontSize.sm, fontWeight: '500', color: colors.text2 },
    typeIconTextWhite: { color: 'white' },
    typeIconEmoji: { fontSize: 20 },
    emojiInput: {
      fontSize: 26, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      textAlign: 'center', minWidth: 64, color: colors.text,
    },
    typeInfo: { flex: 1 },
    typeLabel: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    typeSub: { fontSize: FontSize.xs, color: colors.text3, marginTop: 1 },
    checkmark: { fontSize: FontSize.base, color: colors.green, fontWeight: '500' },
    infoBox: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
      padding: Spacing.md, gap: Spacing.sm,
    },
    infoText: { fontSize: FontSize.sm, color: colors.text2, lineHeight: 20 },
    errorText: { fontSize: FontSize.sm, color: colors.red },
    card: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
      overflow: 'hidden',
    },
    input: {
      fontSize: FontSize.base, color: colors.text,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    },
    hint: { fontSize: FontSize.xs, color: colors.text3, lineHeight: 18 },
  })
}
