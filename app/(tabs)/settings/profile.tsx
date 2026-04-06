import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, Image,
  TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator
} from 'react-native'
import { useRouter } from 'expo-router'

import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useTheme } from '../../../contexts/ThemeContext'
import { supabase } from '../../../lib/supabase'
import AuroraBackground from '../../../components/AuroraBackground'
import { Spacing, FontSize, Radius, type ColorScheme } from '../../../constants/theme'

const ACTIVITY_TYPES = ['Bijoux', 'Textile', 'Déco', 'Mobilier', 'Céramique', 'Autre']

export default function EditProfileScreen() {
  const router = useRouter()
  const { user, fetchUser } = useAuthStore()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  const [shopName, setShopName] = useState(user?.shopName ?? '')
  const [activityType, setActivityType] = useState(user?.activityType ?? '')
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photo_url ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const pickPhoto = () => {
    Alert.alert('Photo de la boutique', 'Choisis une source', [
      { text: 'Galerie', onPress: () => launchPicker('library') },
      { text: 'Appareil photo', onPress: () => launchPicker('camera') },
      { text: 'Annuler', style: 'cancel' },
    ])
  }

  const launchPicker = async (source: 'library' | 'camera') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permission refusée', "L'accès à l'appareil photo est nécessaire."); return }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire."); return }
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })

    if (result.canceled) return

    setIsUploading(true)
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      )
      const binary = atob(manipulated.base64!)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const fileName = `${user?.id}/avatar_${Date.now()}.jpg`
      const { error } = await supabase.storage.from('product-photo').upload(fileName, bytes, { contentType: 'image/jpeg', upsert: true })
      if (error) throw new Error(error.message)
      const { data } = supabase.storage.from('product-photo').getPublicUrl(fileName)
      setPhotoUrl(data.publicUrl)
    } catch (err: any) {
      Alert.alert('Erreur', err.message ?? "Impossible d'uploader la photo.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (!shopName.trim()) { Alert.alert('Champ manquant', 'Le nom de la boutique est obligatoire.'); return }
    setIsLoading(true)
    const { error } = await supabase.from('users').update({
      shop_name: shopName.trim(),
      activity_type: activityType,
      photo_url: photoUrl,
    }).eq('id', user?.id)
    setIsLoading(false)
    if (error) { Alert.alert('Erreur', error.message); return }
    await fetchUser()
    router.back()
  }

  const initial = (shopName[0] ?? user?.email?.[0] ?? 'T').toUpperCase()

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Mon profil</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            <Text style={[styles.saveBtn, isLoading && { opacity: 0.5 }]}>
              {isLoading ? '...' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrap} onPress={pickPhoto} activeOpacity={0.8}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.accent }]} />
              )}
              {!photoUrl && !isUploading && (
                <Text style={styles.avatarText}>{initial}</Text>
              )}
              {isUploading && <ActivityIndicator color="#fff" />}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Logo ou photo de ta boutique</Text>
          </View>

          <Text style={styles.sectionLabel}>Boutique</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nom</Text>
              <TextInput
                style={styles.input}
                value={shopName}
                onChangeText={setShopName}
                placeholder="Loop Studio"
                placeholderTextColor={colors.text3}
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{user?.email ?? '—'}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Type de créations</Text>
          <View style={styles.chipRow}>
            {ACTIVITY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, activityType === type && styles.chipActive]}
                onPress={() => setActivityType(type)}
              >
                <Text style={[styles.chipText, activityType === type && styles.chipTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
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
    topbar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    },
    backBtn: { fontSize: FontSize.base, color: colors.text2 },
    topbarTitle: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    saveBtn: { fontSize: FontSize.base, fontWeight: '500', color: colors.accent },
    form: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
    avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
    avatarWrap: {
      width: 88, height: 88, borderRadius: 99,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { color: '#FFF', fontSize: 36, fontWeight: '300' },
    avatarHint: { fontSize: FontSize.xs, color: colors.text3 },
    cameraBadge: {
      position: 'absolute', bottom: 4, right: 4,
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center', justifyContent: 'center',
    },
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
    field: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm,
    },
    fieldLabel: { fontSize: FontSize.base, color: colors.text, width: 80 },
    fieldValue: { fontSize: FontSize.base, color: colors.text2, flex: 1 },
    input: { fontSize: FontSize.base, color: colors.text, flex: 1 },
    separator: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
      marginHorizontal: Spacing.md,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    chip: {
      paddingHorizontal: Spacing.md, paddingVertical: 8,
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
  })
}
