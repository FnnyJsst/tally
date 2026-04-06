import { useState, useEffect, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Switch, Alert, SafeAreaView, ActivityIndicator
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'

import { useProductStore } from '../../../../stores/useProductStore'
import { useTheme } from '../../../../contexts/ThemeContext'
import { supabase } from '../../../../lib/supabase'
import AuroraBackground from '../../../../components/AuroraBackground'
import { Spacing, FontSize, Radius, type ColorScheme } from '../../../../constants/theme'
import ProductImagePicker from '../../../../components/ProductImagePicker'

const CATEGORIES = ['Bijoux', 'Textile', 'Déco', 'Mobilier', 'Céramique', 'Autre']

export default function EditProductScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { fetchProducts } = useProductStore()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  const [isFetching, setIsFetching] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('')
  const [threshold, setThreshold] = useState('5')
  const [hasVariants, setHasVariants] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [variants, setVariants] = useState<Array<{ id?: string; name: string; photoUrl: string }>>([])
  const [removedVariantIds, setRemovedVariantIds] = useState<string[]>([])

  useEffect(() => { loadProduct() }, [id])

  const loadProduct = async () => {
    setIsFetching(true)
    const { data, error } = await supabase.from('products').select('*, variants(*)').eq('id', id).single()
    if (error || !data) { Alert.alert('Erreur', 'Produit introuvable.'); router.back(); return }
    setName(data.name ?? '')
    setSku(data.sku ?? '')
    setCategory(data.category ?? '')
    setThreshold(String(data.low_stock_threshold ?? 5))
    setHasVariants(data.has_variants ?? false)
    setPhotoUrl(data.photo_url ?? null)
    setVariants((data.variants ?? []).map((v: any) => ({ id: v.id, name: v.name, photoUrl: v.photo_url ?? '' })))
    setIsFetching(false)
  }

  const addVariant = () => setVariants([...variants, { name: '', photoUrl: '' }])
  const removeVariant = (index: number) => {
    const v = variants[index]
    if (v.id) setRemovedVariantIds(prev => [...prev, v.id!])
    setVariants(variants.filter((_, i) => i !== index))
  }
  const updateVariant = (index: number, field: 'name' | 'photoUrl', value: string) =>
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v))

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Champ manquant', 'Le nom du produit est obligatoire.'); return }
    setIsLoading(true)
    try {
      const { error: productError } = await supabase.from('products').update({
        name: name.trim(), sku: sku.trim() || null, category: category || null,
        has_variants: hasVariants, low_stock_threshold: parseInt(threshold) || 5, photo_url: photoUrl,
      }).eq('id', id)
      if (productError) throw new Error(productError.message)

      if (removedVariantIds.length > 0) {
        await supabase.from('variants').delete().in('id', removedVariantIds)
      }
      for (const v of variants.filter(v => hasVariants ? v.name.trim() : true)) {
        if (v.id) {
          await supabase.from('variants').update({ name: v.name, photo_url: v.photoUrl || null }).eq('id', v.id)
        } else {
          await supabase.from('variants').insert({ product_id: id, name: v.name || 'Default', photo_url: v.photoUrl || null })
        }
      }
      await fetchProducts()
      router.back()
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Une erreur est survenue.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <AuroraBackground>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.text} />
          </View>
        </SafeAreaView>
      </AuroraBackground>
    )
  }

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Modifier le produit</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            <Text style={[styles.saveBtn, isLoading && { opacity: 0.5 }]}>
              {isLoading ? '...' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.photoSection}>
            <ProductImagePicker value={photoUrl} onChange={setPhotoUrl} size={120} />
            <View style={styles.photoInfo}>
              <Text style={styles.photoTitle}>Photo du produit</Text>
              <Text style={styles.photoHint}>Format carré recommandé{'\n'}Galerie ou appareil photo</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Informations</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nom *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Loop — Rouge corail" placeholderTextColor={colors.text3} />
            </View>
            <View style={styles.separator} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>SKU</Text>
              <TextInput style={styles.input} value={sku} onChangeText={setSku} placeholder="LRC-001" placeholderTextColor={colors.text3} autoCapitalize="characters" />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Catégorie</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipActive]} onPress={() => setCategory(cat)}>
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Stock</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Seuil d'alerte</Text>
              <TextInput style={[styles.input, styles.inputRight]} value={threshold} onChangeText={setThreshold} keyboardType="numeric" placeholder="5" placeholderTextColor={colors.text3} />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Variantes</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Ce produit a des variantes</Text>
              <Switch value={hasVariants} onValueChange={setHasVariants} trackColor={{ false: colors.surface2, true: colors.accent }} thumbColor="white" />
            </View>
          </View>

          {hasVariants && (
            <View style={styles.card}>
              {variants.map((v, i) => (
                <View key={v.id ?? i}>
                  {i > 0 && <View style={styles.separator} />}
                  <View style={styles.variantRow}>
                    <ProductImagePicker value={v.photoUrl || null} onChange={(url) => updateVariant(i, 'photoUrl', url)} size={56} />
                    <TextInput style={[styles.input, { flex: 1 }]} value={v.name} onChangeText={(val) => updateVariant(i, 'name', val)} placeholder={`Variante ${i + 1}`} placeholderTextColor={colors.text3} />
                    {variants.length > 1 && (
                      <TouchableOpacity onPress={() => removeVariant(i)}>
                        <Text style={styles.removeBtn}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
              <View style={styles.separator} />
              <TouchableOpacity style={styles.addVariantBtn} onPress={addVariant}>
                <Text style={styles.addVariantText}>+ Ajouter une variante</Text>
              </TouchableOpacity>
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
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    topbar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    },
    backBtn: { fontSize: FontSize.base, color: colors.text2 },
    topbarTitle: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    saveBtn: { fontSize: FontSize.base, fontWeight: '500', color: colors.accent },
    form: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
    photoSection: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.md },
    photoInfo: { flex: 1, gap: 4 },
    photoTitle: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    photoHint: { fontSize: FontSize.xs, color: colors.text3, lineHeight: 18 },
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
    field: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm,
    },
    fieldLabel: { fontSize: FontSize.base, color: colors.text, flex: 1 },
    input: { fontSize: FontSize.base, color: colors.text, flex: 1, paddingVertical: 4 },
    inputRight: { flex: 0, textAlign: 'right', minWidth: 60 },
    separator: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border, marginHorizontal: Spacing.md },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
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
    chipTextActive: { color: '#FFF' },
    variantRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    removeBtn: { fontSize: FontSize.xs, color: colors.text3, padding: 4 },
    addVariantBtn: { padding: Spacing.md, alignItems: 'center' },
    addVariantText: { fontSize: FontSize.sm, color: colors.accent, fontWeight: '500' },
  })
}
