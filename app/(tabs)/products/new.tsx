import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Switch, Alert, SafeAreaView
} from 'react-native'
import { useRouter } from 'expo-router'

import { useProductStore } from '../../../stores/useProductStore'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useTheme } from '../../../contexts/ThemeContext'
import { supabase } from '../../../lib/supabase'
import AuroraBackground from '../../../components/AuroraBackground'
import { Spacing, FontSize, Radius, type ColorScheme } from '../../../constants/theme'
import ProductImagePicker from '../../../components/ProductImagePicker'

const CATEGORIES = ['Bijoux', 'Textile', 'Déco', 'Mobilier', 'Céramique', 'Autre']

export default function NewProductScreen() {
  const router = useRouter()
  const { fetchProducts } = useProductStore()
  const { user } = useAuthStore()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('')
  const [threshold, setThreshold] = useState('5')
  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants] = useState([{ name: '', photoUrl: '' }])
  const [initialStock, setInitialStock] = useState('0')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const addVariant = () => setVariants([...variants, { name: '', photoUrl: '' }])
  const removeVariant = (index: number) => setVariants(variants.filter((_, i) => i !== index))
  const updateVariant = (index: number, field: 'name' | 'photoUrl', value: string) =>
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v))

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Champ manquant', 'Le nom du produit est obligatoire.')
      return
    }
    setIsLoading(true)
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          user_id: user?.id,
          name: name.trim(),
          sku: sku.trim() || null,
          category: category || null,
          has_variants: hasVariants,
          low_stock_threshold: parseInt(threshold) || 5,
          photo_url: photoUrl,
        })
        .select()
        .single()

      if (productError || !product) throw new Error(productError?.message ?? 'Impossible de créer le produit.')

      const variantNames = hasVariants
        ? variants.filter(v => v.name.trim())
        : [{ name: 'Default', photoUrl: '' }]

      const { data: createdVariants, error: variantError } = await supabase
        .from('variants')
        .insert(variantNames.map(v => ({
          product_id: product.id,
          name: v.name || 'Default',
          photo_url: v.photoUrl || null,
        })))
        .select()

      if (variantError) throw new Error(variantError.message ?? 'Impossible de créer les variantes.')

      const stock = parseInt(initialStock) || 0
      if (stock > 0 && createdVariants && createdVariants.length > 0) {
        const { data: channels } = await supabase
          .from('channels').select('id').eq('user_id', user?.id).limit(1)
        if (channels && channels.length > 0) {
          await supabase.from('stock_entries').insert(
            createdVariants.map(v => ({
              variant_id: v.id, channel_id: channels[0].id,
              quantity: stock, type: 'restock', note: 'Stock initial',
            }))
          )
        }
      }

      await fetchProducts()
      router.back()
    } catch (e: any) {
      const msg = typeof e?.message === 'string' && e.message ? e.message : 'Une erreur est survenue.'
      Alert.alert('Erreur', msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Nouveau produit</Text>
          <TouchableOpacity onPress={handleCreate} disabled={isLoading} activeOpacity={0.85}>
            <Text style={[styles.saveBtn, isLoading && { opacity: 0.5 }]}>
              {isLoading ? '...' : 'Créer'}
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
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Loop — Rouge corail"
                placeholderTextColor={colors.text3}
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>SKU</Text>
              <TextInput
                style={styles.input}
                value={sku}
                onChangeText={setSku}
                placeholder="LRC-001"
                placeholderTextColor={colors.text3}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Catégorie</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Stock</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Stock initial</Text>
              <TextInput
                style={[styles.input, styles.inputRight]}
                value={initialStock}
                onChangeText={setInitialStock}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.text3}
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Seuil d'alerte</Text>
              <TextInput
                style={[styles.input, styles.inputRight]}
                value={threshold}
                onChangeText={setThreshold}
                keyboardType="numeric"
                placeholder="5"
                placeholderTextColor={colors.text3}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Variantes</Text>
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Ce produit a des variantes</Text>
              <Switch
                value={hasVariants}
                onValueChange={setHasVariants}
                trackColor={{ false: colors.surface2, true: colors.accent }}
                thumbColor="white"
              />
            </View>
          </View>

          {hasVariants && (
            <View style={styles.card}>
              {variants.map((v, i) => (
                <View key={i}>
                  {i > 0 && <View style={styles.separator} />}
                  <View style={styles.variantRow}>
                    <ProductImagePicker
                      value={v.photoUrl || null}
                      onChange={(url) => updateVariant(i, 'photoUrl', url)}
                      size={56}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={v.name}
                      onChangeText={(val) => updateVariant(i, 'name', val)}
                      placeholder={`Variante ${i + 1} (ex: Rouge M)`}
                      placeholderTextColor={colors.text3}
                    />
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

          {/* Bouton Créer principal */}
          <TouchableOpacity
            style={[styles.createBtn, isLoading && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.createBtnText}>{isLoading ? 'Création...' : 'Créer le produit'}</Text>
          </TouchableOpacity>

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
    separator: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
      marginHorizontal: Spacing.md,
    },
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
    addVariantText: { fontSize: FontSize.sm, color: colors.text2, fontWeight: '500' },
    createBtn: {
      borderRadius: Radius.full,
      paddingVertical: 14, alignItems: 'center',
      marginTop: Spacing.md,
      backgroundColor: colors.accent,
    },
    createBtnText: { color: '#FFF', fontSize: FontSize.base, fontWeight: '500' },
  })
}
