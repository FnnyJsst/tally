import { useEffect, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, SafeAreaView
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useProductStore } from '../../../stores/useProductStore'
import { useStockStore } from '../../../stores/useStockStore'
import { useTheme } from '../../../contexts/ThemeContext'
import AuroraBackground from '../../../components/AuroraBackground'
import { Spacing, FontSize, Radius, type ColorScheme } from '../../../constants/theme'

export default function ProductDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { products, fetchProduct, selectedProduct, deleteProduct } = useProductStore()
  const { entries } = useStockStore()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  useEffect(() => {
    if (id) fetchProduct(id)
  }, [id])

  const product = selectedProduct ?? products.find(p => p.id === id)

  if (!product) {
    return (
      <AuroraBackground>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </AuroraBackground>
    )
  }

  const getVariantStock = (variantId: string) =>
    entries.filter(e => e.variantId === variantId).reduce((sum, e) => sum + e.quantity, 0)

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
        { text: 'Supprimer', style: 'destructive', onPress: async () => { await deleteProduct(product.id); router.back() } }
      ]
    )
  }

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
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
          <View style={styles.productHeader}>
            <View style={styles.productThumb}>
              <Text style={styles.productThumbText}>{product.name[0]?.toUpperCase()}</Text>
            </View>
            <Text style={styles.productName}>{product.name}</Text>
            {product.sku ? <Text style={styles.productSku}>SKU · {product.sku}</Text> : null}
            <View style={[
              styles.stockBadge,
              { backgroundColor: isLow ? colors.redBg : colors.greenBg,
                borderColor: isLow ? colors.redBorder : colors.greenBorder }
            ]}>
              <Text style={[styles.stockBadgeText, { color: isLow ? colors.red : colors.green }]}>
                {totalStock} unité{totalStock !== 1 ? 's' : ''} · {isLow ? 'Stock bas' : 'OK'}
              </Text>
            </View>
          </View>

          {product.variants && product.variants.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Variantes</Text>
              <View style={styles.card}>
                {product.variants.map((variant, i) => {
                  const vStock = getVariantStock(variant.id)
                  return (
                    <View key={variant.id}>
                      {i > 0 && <View style={styles.separator} />}
                      <TouchableOpacity
                        style={styles.variantRow}
                        onPress={() => router.push(`/(tabs)/stock/new?productId=${product.id}&variantId=${variant.id}` as any)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.variantLeft}>
                          <Text style={styles.variantName}>{variant.name}</Text>
                          <Text style={styles.variantHint}>Enregistrer un mouvement</Text>
                        </View>
                        <Text style={[
                          styles.variantStock,
                          vStock <= 0 && { color: colors.red },
                          vStock > 0 && vStock <= product.lowStockThreshold && { color: colors.orange },
                        ]}>
                          {vStock}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.text3} />
                      </TouchableOpacity>
                    </View>
                  )
                })}
              </View>
            </>
          )}

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
              <Text style={styles.infoValue}>{product.hasVariants ? 'Avec variantes' : 'Produit simple'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.newMovementBtn}
            onPress={() => router.push(`/(tabs)/stock/new?productId=${product.id}` as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.newMovementText}>Enregistrer un mouvement</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Supprimer ce produit</Text>
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
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { fontSize: FontSize.base, color: colors.text3 },
    topbar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    },
    backBtn: { fontSize: FontSize.base, color: colors.text2 },
    topbarTitle: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    editBtn: { fontSize: FontSize.base, color: colors.accent },
    content: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
    productHeader: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.sm },
    productThumb: {
      width: 72, height: 72, borderRadius: Radius.lg,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.surface2,
      borderWidth: isDark ? 1 : 0,
      borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
    },
    productThumbText: { fontSize: 32, color: colors.text2, fontWeight: '300' },
    productName: { fontSize: 20, fontWeight: '400', color: colors.text, letterSpacing: -0.3, textAlign: 'center' },
    productSku: { fontSize: FontSize.xs, color: colors.text3, fontVariant: ['tabular-nums'] },
    stockBadge: {
      paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.full,
      borderWidth: 1, marginTop: Spacing.xs,
    },
    stockBadgeText: { fontSize: FontSize.sm, fontWeight: '500' },
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
    separator: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border, marginHorizontal: Spacing.md },
    variantRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    },
    variantLeft: { flex: 1, gap: 2 },
    variantName: { fontSize: FontSize.base, color: colors.text, fontWeight: '500' },
    variantHint: { fontSize: FontSize.xs, color: colors.text3 },
    variantStock: { fontSize: FontSize.base, fontWeight: '500', color: colors.green, fontVariant: ['tabular-nums'] },
    infoRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    },
    infoLabel: { fontSize: FontSize.base, color: colors.text },
    infoValue: { fontSize: FontSize.base, color: colors.text2 },
    newMovementBtn: {
      borderRadius: Radius.full, paddingVertical: 14,
      alignItems: 'center', marginTop: Spacing.md,
      backgroundColor: colors.accent,
    },
    newMovementText: { color: '#FFF', fontSize: FontSize.base, fontWeight: '500' },
    deleteBtn: { paddingVertical: 14, alignItems: 'center' },
    deleteBtnText: { fontSize: FontSize.base, color: colors.red },
  })
}
