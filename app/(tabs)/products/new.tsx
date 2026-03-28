import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Switch, Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { useProductStore } from '../../../stores/useProductStore'
import { useAuthStore } from '../../../stores/useAuthStore'
import { supabase } from '../../../lib/supabase'
import { Colors, Spacing, FontSize, Radius } from '../../../constants/theme'

const CATEGORIES = ['Bijoux', 'Textile', 'Déco', 'Mobilier', 'Céramique', 'Autre']

export default function NewProductScreen() {
  const router = useRouter()
  const { fetchProducts } = useProductStore()
  const { user } = useAuthStore()

  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState('')
  const [threshold, setThreshold] = useState('5')
  const [hasVariants, setHasVariants] = useState(false)
  const [variants, setVariants] = useState([{ name: '' }])
  const [initialStock, setInitialStock] = useState('0')
  const [isLoading, setIsLoading] = useState(false)

  const addVariant = () => setVariants([...variants, { name: '' }])
  const removeVariant = (index: number) =>
    setVariants(variants.filter((_, i) => i !== index))
  const updateVariant = (index: number, value: string) =>
    setVariants(variants.map((v, i) => i === index ? { name: value } : v))

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Champ manquant', 'Le nom du produit est obligatoire.')
      return
    }

    setIsLoading(true)
    try {
      // 1. Créer le produit
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          user_id: user?.id,
          name: name.trim(),
          sku: sku.trim(),
          category,
          has_variants: hasVariants,
          low_stock_threshold: parseInt(threshold) || 5,
        })
        .select()
        .single()

      if (productError || !product) throw new Error(productError?.message)

      // 2. Créer les variantes
      const variantNames = hasVariants
        ? variants.filter(v => v.name.trim())
        : [{ name: 'Default' }]

      const { data: createdVariants, error: variantError } = await supabase
        .from('variants')
        .insert(variantNames.map(v => ({
          product_id: product.id,
          name: v.name || 'Default',
        })))
        .select()

      if (variantError) throw new Error(variantError.message)

      // 3. Stock initial si > 0
      const stock = parseInt(initialStock) || 0
      if (stock > 0 && createdVariants && createdVariants.length > 0) {
        // Chercher un canal "manuel" existant ou utiliser le premier canal
        const { data: channels } = await supabase
          .from('channels')
          .select('id')
          .eq('user_id', user?.id)
          .limit(1)

        if (channels && channels.length > 0) {
          await supabase.from('stock_entries').insert(
            createdVariants.map(v => ({
              variant_id: v.id,
              channel_id: channels[0].id,
              quantity: stock,
              type: 'restock',
              note: 'Stock initial',
            }))
          )
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

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Nouveau produit</Text>
        <TouchableOpacity onPress={handleCreate} disabled={isLoading}>
          <Text style={[styles.saveBtn, isLoading && { opacity: 0.5 }]}>
            {isLoading ? '...' : 'Créer'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>

        {/* Infos générales */}
        <Text style={styles.sectionLabel}>Informations</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Loop — Rouge corail"
              placeholderTextColor={Colors.text3}
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
              placeholderTextColor={Colors.text3}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Catégorie */}
        <Text style={styles.sectionLabel}>Catégorie</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stock */}
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
              placeholderTextColor={Colors.text3}
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
              placeholderTextColor={Colors.text3}
            />
          </View>
        </View>

        {/* Variantes */}
        <Text style={styles.sectionLabel}>Variantes</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Ce produit a des variantes</Text>
            <Switch
              value={hasVariants}
              onValueChange={setHasVariants}
              trackColor={{ true: Colors.accent }}
              thumbColor="white"
            />
          </View>
        </View>

        {hasVariants && (
          <View style={styles.card}>
            {variants.map((v, i) => (
              <View key={i}>
                {i > 0 && <View style={styles.separator} />}
                <View style={styles.field}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={v.name}
                    onChangeText={(val) => updateVariant(i, val)}
                    placeholder={`Variante ${i + 1} (ex: Rouge M)`}
                    placeholderTextColor={Colors.text3}
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: 60,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    fontSize: FontSize.base,
    color: Colors.text2,
  },
  topbarTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
  },
  saveBtn: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.accent,
  },
  form: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: Colors.text3,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: FontSize.base,
    color: Colors.text,
    flex: 1,
  },
  input: {
    fontSize: FontSize.base,
    color: Colors.text,
    flex: 1,
    paddingVertical: 4,
  },
  inputRight: {
    flex: 0,
    textAlign: 'right',
    minWidth: 60,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text2,
  },
  chipTextActive: {
    color: 'white',
  },
  removeBtn: {
    fontSize: FontSize.xs,
    color: Colors.text3,
    padding: 4,
  },
  addVariantBtn: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  addVariantText: {
    fontSize: FontSize.sm,
    color: Colors.text2,
    fontWeight: '500',
  },
})
