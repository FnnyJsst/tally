import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, SafeAreaView, ActivityIndicator
} from 'react-native'
import { useRouter } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useProductStore } from '../../../stores/useProductStore'
import { useTheme } from '../../../contexts/ThemeContext'
import { supabase } from '../../../lib/supabase'
import AuroraBackground from '../../../components/AuroraBackground'
import { Spacing, FontSize, Radius, type ColorScheme } from '../../../constants/theme'

type ParsedRow = {
  name: string
  sku: string
  category: string
  threshold: number
  valid: boolean
  error?: string
}

const VALID_CATEGORIES = ['Bijoux', 'Textile', 'Déco', 'Mobilier', 'Céramique', 'Autre']

function parseCSV(raw: string): ParsedRow[] {
  const lines = raw.trim().split('\n').filter(l => l.trim())
  if (lines.length === 0) return []

  const firstCell = lines[0].split(',')[0].trim().toLowerCase()
  const dataLines = ['nom', 'name', 'produit'].includes(firstCell) ? lines.slice(1) : lines

  return dataLines.map((line) => {
    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
    const [name = '', sku = '', category = '', thresholdRaw = '5'] = parts

    if (!name) return { name, sku, category, threshold: 5, valid: false, error: 'Nom manquant' }

    const threshold = parseInt(thresholdRaw) || 5
    const resolvedCategory = VALID_CATEGORIES.find(
      c => c.toLowerCase() === category.toLowerCase()
    ) ?? (category || '')

    return { name, sku, category: resolvedCategory, threshold, valid: true }
  })
}

export default function ImportCSVScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { fetchProducts } = useProductStore()
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState<ParsedRow[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'public.comma-separated-values-text'],
        copyToCacheDirectory: true,
      })
      if (result.canceled) return
      const uri = result.assets[0].uri
      const response = await fetch(uri)
      const text = await response.text()
      setCsvText(text)
      setPreview(null)
      const rows = parseCSV(text)
      if (rows.length > 0) setPreview(rows)
      else Alert.alert('Aucune ligne', 'Le fichier ne contient pas de données valides.')
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible de lire le fichier.')
    }
  }

  const handlePreview = () => {
    if (!csvText.trim()) {
      Alert.alert('Champ vide', 'Colle ton CSV ou importe un fichier.')
      return
    }
    const rows = parseCSV(csvText)
    if (rows.length === 0) {
      Alert.alert('Aucune ligne', 'Le CSV ne contient pas de données valides.')
      return
    }
    setPreview(rows)
  }

  const handleImport = async () => {
    if (!preview) return
    const validRows = preview.filter(r => r.valid)
    if (validRows.length === 0) {
      Alert.alert('Aucun produit valide', 'Corrige les erreurs avant d\'importer.')
      return
    }

    setIsLoading(true)
    let imported = 0
    let errors = 0

    for (const row of validRows) {
      try {
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            user_id: user?.id,
            name: row.name,
            sku: row.sku || null,
            category: row.category || null,
            has_variants: false,
            low_stock_threshold: row.threshold,
          })
          .select()
          .single()

        if (productError || !product) { errors++; continue }

        const { error: variantError } = await supabase.from('variants').insert({
          product_id: product.id,
          name: 'Default',
        })

        if (variantError) errors++
        else imported++
      } catch {
        errors++
      }
    }

    await fetchProducts()
    setIsLoading(false)

    const msg = errors > 0
      ? `${imported} produit(s) importé(s), ${errors} erreur(s).`
      : `${imported} produit(s) importé(s) avec succès.`

    Alert.alert('Import terminé', msg, [
      { text: 'OK', onPress: () => router.back() }
    ])
  }

  const validCount = preview?.filter(r => r.valid).length ?? 0

  return (
    <AuroraBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.topbarTitle}>Import CSV</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          <View style={styles.card}>
            <Text style={styles.instrTitle}>Format attendu</Text>
            <Text style={styles.instrText}>
              Une ligne par produit, colonnes séparées par des virgules :
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>Nom,SKU,Catégorie,Seuil</Text>
              <Text style={styles.codeText}>Boucle or,BOR-001,Bijoux,5</Text>
              <Text style={styles.codeText}>Collier rouge,,Bijoux,3</Text>
            </View>
            <Text style={styles.instrNote}>
              Catégories acceptées : {VALID_CATEGORIES.join(', ')}
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Fichier ou texte</Text>
          <TouchableOpacity style={styles.fileBtn} onPress={handlePickFile} activeOpacity={0.85}>
            <Text style={styles.fileBtnText}>Choisir un fichier .csv</Text>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>ou colle le texte</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.card}>
            <TextInput
              style={styles.textArea}
              value={csvText}
              onChangeText={(t) => { setCsvText(t); setPreview(null) }}
              placeholder={'Nom,SKU,Catégorie,Seuil\nBoucle or,BOR-001,Bijoux,5'}
              placeholderTextColor={colors.text3}
              multiline
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.previewBtn} onPress={handlePreview}>
            <Text style={styles.previewBtnText}>Prévisualiser</Text>
          </TouchableOpacity>

          {preview && (
            <>
              <Text style={styles.sectionLabel}>
                {validCount} produit(s) à importer
              </Text>
              <View style={styles.card}>
                {preview.map((row, i) => (
                  <View key={i}>
                    {i > 0 && <View style={styles.separator} />}
                    <View style={styles.previewRow}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: row.valid ? colors.green : colors.red }
                      ]} />
                      <View style={styles.previewInfo}>
                        <Text style={styles.previewName} numberOfLines={1}>
                          {row.name || '—'}
                        </Text>
                        <Text style={styles.previewMeta} numberOfLines={1}>
                          {[row.sku, row.category, `Seuil: ${row.threshold}`]
                            .filter(Boolean).join(' · ')}
                        </Text>
                        {row.error && (
                          <Text style={styles.previewError}>{row.error}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.importBtn, isLoading && { opacity: 0.6 }]}
                onPress={handleImport}
                disabled={isLoading || validCount === 0}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.importBtnText}>
                    Importer {validCount} produit{validCount > 1 ? 's' : ''}
                  </Text>
                )}
              </TouchableOpacity>
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
    backBtn: { fontSize: FontSize.base, color: colors.text2, width: 60 },
    topbarTitle: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    content: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
    sectionLabel: {
      fontSize: FontSize.xs, fontWeight: '500', letterSpacing: 0.7,
      textTransform: 'uppercase', color: colors.text3, marginTop: Spacing.sm,
    },
    card: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
      overflow: 'hidden',
      padding: Spacing.md, gap: Spacing.sm,
    },
    instrTitle: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    instrText: { fontSize: FontSize.sm, color: colors.text2, lineHeight: 20 },
    codeBlock: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface2,
      borderRadius: Radius.sm,
      padding: Spacing.md, gap: 2,
    },
    codeText: { fontSize: FontSize.xs, color: colors.text, fontVariant: ['tabular-nums'] },
    instrNote: { fontSize: FontSize.xs, color: colors.text3, lineHeight: 18 },
    textArea: {
      fontSize: FontSize.sm, color: colors.text,
      minHeight: 140, textAlignVertical: 'top',
    },
    separator: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
    },
    fileBtn: {
      borderRadius: Radius.full,
      paddingVertical: 14, alignItems: 'center',
      backgroundColor: colors.accent,
    },
    fileBtnText: { fontSize: FontSize.base, fontWeight: '500', color: '#FFF' },
    orRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    orLine: {
      flex: 1, height: 1,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
    },
    orText: { fontSize: FontSize.xs, color: colors.text3 },
    previewBtn: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : colors.surface,
      borderRadius: Radius.full,
      borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
      paddingVertical: 12, alignItems: 'center',
    },
    previewBtnText: { fontSize: FontSize.base, fontWeight: '500', color: colors.text2 },
    previewRow: {
      flexDirection: 'row', alignItems: 'flex-start',
      gap: Spacing.md, paddingVertical: Spacing.sm,
    },
    statusDot: { width: 8, height: 8, borderRadius: 99, marginTop: 5, flexShrink: 0 },
    previewInfo: { flex: 1, gap: 2 },
    previewName: { fontSize: FontSize.base, fontWeight: '500', color: colors.text },
    previewMeta: { fontSize: FontSize.xs, color: colors.text3 },
    previewError: { fontSize: FontSize.xs, color: colors.red },
    importBtn: {
      borderRadius: Radius.full,
      paddingVertical: 14, alignItems: 'center', marginTop: Spacing.sm,
      backgroundColor: colors.accent,
    },
    importBtnText: { color: '#FFF', fontSize: FontSize.base, fontWeight: '500' },
  })
}
