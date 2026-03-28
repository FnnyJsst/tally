import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { useChannelStore } from '../../../stores/useChannelStore'
import { useAuthStore } from '../../../stores/useAuthStore'
import { Colors, Spacing, FontSize, Radius } from '../../../constants/theme'
import type { ChannelType } from '../../../types'

const CHANNEL_TYPES: { type: ChannelType; label: string; icon: string; manual: boolean }[] = [
  { type: 'etsy',        label: 'Etsy',             icon: 'E', manual: false },
  { type: 'woocommerce', label: 'WooCommerce',       icon: 'W', manual: false },
  { type: 'physical',    label: 'Boutique physique', icon: '◻', manual: true },
  { type: 'market',      label: 'Marché / Salon',    icon: '⊕', manual: true },
  { type: 'other',       label: 'Autre',             icon: '+', manual: true },
]

export default function NewChannelScreen() {
  const router = useRouter()
  const { createChannel } = useChannelStore()
  const { user } = useAuthStore()

  const [selectedType, setSelectedType] = useState<ChannelType | null>(null)
  const [name, setName] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const typeConfig = CHANNEL_TYPES.find(t => t.type === selectedType)

  const handleCreate = async () => {
    if (!selectedType) {
      Alert.alert('Champ manquant', 'Sélectionne un type de canal.')
      return
    }
    if (!name.trim()) {
      Alert.alert('Champ manquant', 'Donne un nom à ce canal.')
      return
    }

    setIsLoading(true)
    const { error } = await createChannel({
      user_id: user?.id,
      name: name.trim(),
      type: selectedType,
      api_token: apiToken.trim() || undefined,
      is_active: true,
    } as any)
    setIsLoading(false)

    if (error) {
      Alert.alert('Erreur', error)
      return
    }

    router.back()
  }

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Ajouter un canal</Text>
        <TouchableOpacity onPress={handleCreate} disabled={isLoading}>
          <Text style={[styles.saveBtn, isLoading && { opacity: 0.5 }]}>
            {isLoading ? '...' : 'Ajouter'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionLabel}>Type de canal</Text>
        <View style={styles.typeList}>
          {CHANNEL_TYPES.map((t) => (
            <TouchableOpacity
              key={t.type}
              style={[styles.typeRow, selectedType === t.type && styles.typeRowActive]}
              onPress={() => {
                setSelectedType(t.type)
                if (!name) setName(t.label)
              }}
            >
              <View style={[styles.typeIcon, selectedType === t.type && styles.typeIconActive, t.manual && styles.typeIconManual]}>
                <Text style={[styles.typeIconText, (selectedType === t.type || !t.manual) && styles.typeIconTextWhite]}>
                  {t.icon}
                </Text>
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeLabel}>{t.label}</Text>
                <Text style={styles.typeSub}>{t.manual ? 'Saisie manuelle' : 'Connexion API'}</Text>
              </View>
              {selectedType === t.type && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {selectedType && (
          <>
            <Text style={styles.sectionLabel}>Nom</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nom du canal"
                placeholderTextColor={Colors.text3}
              />
            </View>

            {typeConfig && !typeConfig.manual && (
              <>
                <Text style={styles.sectionLabel}>Clé API</Text>
                <View style={styles.card}>
                  <TextInput
                    style={styles.input}
                    value={apiToken}
                    onChangeText={setApiToken}
                    placeholder="Colle ta clé API ici"
                    placeholderTextColor={Colors.text3}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                  />
                </View>
                <Text style={styles.hint}>
                  {selectedType === 'etsy'
                    ? 'Trouve ta clé dans Etsy › Paramètres › Applications'
                    : 'Trouve ta clé dans WooCommerce › Réglages › Avancé › REST API'}
                </Text>
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingTop: 60 },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg,
  },
  backBtn: { fontSize: FontSize.base, color: Colors.text2 },
  topbarTitle: { fontSize: FontSize.base, fontWeight: '500', color: Colors.text },
  saveBtn: { fontSize: FontSize.base, fontWeight: '500', color: Colors.accent },
  form: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: '500', letterSpacing: 0.7,
    textTransform: 'uppercase', color: Colors.text3, marginTop: Spacing.sm,
  },
  typeList: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  typeRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  typeRowActive: { backgroundColor: Colors.surface2 },
  typeIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  typeIconActive: { backgroundColor: Colors.accent },
  typeIconManual: { backgroundColor: Colors.border },
  typeIconText: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.text2 },
  typeIconTextWhite: { color: 'white' },
  typeInfo: { flex: 1 },
  typeLabel: { fontSize: FontSize.base, fontWeight: '500', color: Colors.text },
  typeSub: { fontSize: FontSize.xs, color: Colors.text3, marginTop: 1 },
  checkmark: { fontSize: FontSize.base, color: Colors.green, fontWeight: '500' },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  input: {
    fontSize: FontSize.base, color: Colors.text,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  hint: { fontSize: FontSize.xs, color: Colors.text3, lineHeight: 18 },
})
