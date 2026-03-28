import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, TextInput
} from 'react-native'
import { useRouter } from 'expo-router'
import { useProductStore } from '../../../stores/useProductStore'
import { useChannelStore } from '../../../stores/useChannelStore'
import { useStockStore } from '../../../stores/useStockStore'
import { Colors, Spacing, FontSize, Radius } from '../../../constants/theme'
import type { MovementType } from '../../../types'

const MOVEMENT_TYPES: { value: MovementType; label: string; sign: string }[] = [
  { value: 'sale',       label: 'Vente',      sign: '−' },
  { value: 'restock',    label: 'Réassort',   sign: '+' },
  { value: 'adjustment', label: 'Ajustement', sign: '±' },
  { value: 'transfer',   label: 'Transfert',  sign: '→' },
  { value: 'loss',       label: 'Perte',      sign: '✕' },
]

export default function NewMovementScreen() {
  const router = useRouter()
  const { products, fetchProducts } = useProductStore()
  const { channels, fetchChannels } = useChannelStore()
  const { addMovement } = useStockStore()

  const [type, setType] = useState<MovementType>('sale')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchChannels()
  }, [])

  // Auto-sélectionne la première variante quand on choisit un produit
  const product = products.find(p => p.id === selectedProduct)
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0].id)
    }
  }, [selectedProduct])

  // Auto-sélectionne le premier canal
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0].id)
    }
  }, [channels])

  const handleSubmit = async () => {
    if (!selectedProduct) {
      Alert.alert('Champ manquant', 'Sélectionne un produit.')
      return
    }
    if (!selectedVariant) {
      Alert.alert('Champ manquant', 'Sélectionne une variante.')
      return
    }
    if (!selectedChannel) {
      Alert.alert('Champ manquant', 'Sélectionne un canal.')
      return
    }
    if (quantity <= 0) {
      Alert.alert('Quantité invalide', 'La quantité doit être supérieure à 0.')
      return
    }

    setIsLoading(true)
    const { error } = await addMovement({
      variantId: selectedVariant,
      channelId: selectedChannel,
      quantity,
      type,
      note: note.trim() || undefined,
    })
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
        <Text style={styles.topbarTitle}>Nouveau mouvement</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={isLoading}>
          <Text style={[styles.saveBtn, isLoading && { opacity: 0.5 }]}>
            {isLoading ? '...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>

        {/* Type de mouvement */}
        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.typeGrid}>
          {MOVEMENT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeChip, type === t.value && styles.typeChipActive]}
              onPress={() => setType(t.value)}
            >
              <Text style={[styles.typeSign, type === t.value && styles.typeSignActive]}>
                {t.sign}
              </Text>
              <Text style={[styles.typeLabel, type === t.value && styles.typeLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Produit */}
        <Text style={styles.sectionLabel}>Produit</Text>
        <View style={styles.card}>
          {products.length === 0 ? (
            <Text style={styles.emptyPicker}>Aucun produit — crée-en un d'abord</Text>
          ) : (
            products.map((p, i) => (
              <View key={p.id}>
                {i > 0 && <View style={styles.separator} />}
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => setSelectedProduct(p.id)}
                >
                  <Text style={styles.pickerLabel}>{p.name}</Text>
                  {selectedProduct === p.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Variante */}
        {product?.variants && product.variants.length > 1 && (
          <>
            <Text style={styles.sectionLabel}>Variante</Text>
            <View style={styles.card}>
              {product.variants.map((v, i) => (
                <View key={v.id}>
                  {i > 0 && <View style={styles.separator} />}
                  <TouchableOpacity
                    style={styles.pickerRow}
                    onPress={() => setSelectedVariant(v.id)}
                  >
                    <Text style={styles.pickerLabel}>{v.name}</Text>
                    {selectedVariant === v.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Canal */}
        <Text style={styles.sectionLabel}>Canal</Text>
        <View style={styles.card}>
          {channels.length === 0 ? (
            <Text style={styles.emptyPicker}>Aucun canal — configure-en un d'abord</Text>
          ) : (
            channels.map((c, i) => (
              <View key={c.id}>
                {i > 0 && <View style={styles.separator} />}
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => setSelectedChannel(c.id)}
                >
                  <Text style={styles.pickerLabel}>{c.name}</Text>
                  {selectedChannel === c.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Quantité */}
        <Text style={styles.sectionLabel}>Quantité</Text>
        <View style={styles.card}>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Note */}
        <Text style={styles.sectionLabel}>Note (optionnel)</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Ajouter une note..."
            placeholderTextColor={Colors.text3}
            multiline
          />
        </View>

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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeChip: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    gap: 4,
  },
  typeChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  typeSign: {
    fontSize: FontSize.lg,
    color: Colors.text2,
  },
  typeSignActive: {
    color: 'white',
  },
  typeLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.text2,
  },
  typeLabelActive: {
    color: 'white',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  pickerLabel: {
    fontSize: FontSize.base,
    color: Colors.text,
    flex: 1,
  },
  checkmark: {
    fontSize: FontSize.base,
    color: Colors.green,
    fontWeight: '500',
  },
  emptyPicker: {
    fontSize: FontSize.sm,
    color: Colors.text3,
    padding: Spacing.md,
    textAlign: 'center',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 20,
    color: Colors.text,
    lineHeight: 24,
  },
  qtyValue: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.text,
    letterSpacing: -1,
    minWidth: 60,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  noteInput: {
    fontSize: FontSize.base,
    color: Colors.text,
    padding: Spacing.md,
    minHeight: 80,
  },
})
