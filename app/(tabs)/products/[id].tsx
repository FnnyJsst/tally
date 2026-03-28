import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useProductStore } from '../../../stores/useProductStore'
import { useStockStore } from '../../../stores/useStockStore'
import { Colors, Spacing, FontSize, Radius } from '../../../constants/theme'

export default function ProductDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { products, fetchProduct, selectedProduct, deleteProduct } = useProductStore()
  const { entries } = useStockStore()

  useEffect(() => {
    if (id) fetchProduct(id)
  }, [id])

  const product = selectedProduct ?? products.find(p => p.id === id)

  if (!product) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    )
  }

  // Stock par variante
  const getVariantStock = (variantId: string) =>
    entries
      .filter(e => e.variantId === variantId)
      .reduce((sum, e) => sum + e.quantity, 0)

  const totalStock = product.variants?.reduce(
    (sum, v) => sum + getVariantStock(v.id), 0
  ) ?? product.totalStock ?? 0

  const isLow = totalStock <= product.lowStockThreshold

  const handleDelete = () => {
    Alert.alert(
      'Supprimer ce produit',
      'Cette action est irréversible. Tout l\'historique de stock sera perdu.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(product.id)
            router.back()
          }
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Produit</Text>
        <TouchableOpacity onPress={() => router.push(`/(tabs)/products/edit/${product.id}` as any)}>
          <Text style={styles.editBtn}>Modifier</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header produit */}
        <View style={styles.productHeader}>
          <View style={styles.productThumb}>
            <Text style={styles.productThumbText}>
              {product.name[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.productName}>{product.name}</Text>
          {product.sku ? <Text style={styles.productSku}>SKU · {product.sku}</Text> : null}
          <View style={[
            styles.stockBadge,
            { backgroundColor: isLow ? Colors.redBg : Colors.greenBg }
          ]}>
            <Text style={[
              styles.stockBadgeText,
              { color: isLow ? Colors.red : Colors.green }
            ]}>
              {totalStock} unité{totalStock !== 1 ? 's' : ''} · {isLow ? 'Stock bas' : 'OK'}
            </Text>
          </View>
        </View>

        {/* Variantes */}
        {product.variants && product.variants.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Variantes</Text>
            <View style={styles.card}>
              {product.variants.map((variant, i) => {
                const vStock = getVariantStock(variant.id)
                return (
                  <View key={variant.id}>
                    {i > 0 && <View style={styles.separator} />}
                    <View style={styles.variantRow}>
                      <Text style={styles.variantName}>{variant.name}</Text>
                      <Text style={[
                        styles.variantStock,
                        vStock <= 0 && { color: Colors.red },
                        vStock > 0 && vStock <= product.lowStockThreshold && { color: Colors.orange },
                      ]}>
                        {vStock}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </>
        )}

        {/* Infos */}
        <Text style={styles.sectionLabel}>Informations</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Catégorie</Text>
            <Text style={styles.infoValue}>{product.category || '—'}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Seuil d'alerte</Text>
            <Text style={styles.infoValue}>{product.lowStockThreshold} unités</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>
              {product.hasVariants ? 'Avec variantes' : 'Produit simple'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.newMovementBtn}
          onPress={() => router.push('/(tabs)/stock/new' as any)}
        >
          <Text style={styles.newMovementText}>Enregistrer un mouvement</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Supprimer ce produit</Text>
        </TouchableOpacity>

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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  loadingText: {
    fontSize: FontSize.base,
    color: Colors.text3,
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
  editBtn: {
    fontSize: FontSize.base,
    color: Colors.text2,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  productHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  productThumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  productThumbText: {
    fontSize: 32,
    color: Colors.text2,
    fontWeight: '300',
  },
  productName: {
    fontSize: 20,
    fontWeight: '400',
    color: Colors.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  productSku: {
    fontSize: FontSize.xs,
    color: Colors.text3,
    fontVariant: ['tabular-nums'],
  },
  stockBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
  },
  stockBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
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
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  variantName: {
    fontSize: FontSize.base,
    color: Colors.text,
    fontWeight: '500',
  },
  variantStock: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.green,
    fontVariant: ['tabular-nums'],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSize.base,
    color: Colors.text,
  },
  infoValue: {
    fontSize: FontSize.base,
    color: Colors.text2,
  },
  newMovementBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  newMovementText: {
    color: 'white',
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  deleteBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: FontSize.base,
    color: Colors.red,
  },
})
