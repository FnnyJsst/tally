import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Alert, ActivityIndicator
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/useAuthStore'
import { useTheme } from '../contexts/ThemeContext'
import { Spacing, FontSize } from '../constants/theme'

function decode(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

type Props = {
  value?: string | null
  onChange: (url: string) => void
  size?: number
}

export default function ProductImagePicker({ value, onChange, size = 120 }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuthStore()
  const { colors } = useTheme()

  const pickImage = async () => {
    Alert.alert('Ajouter une photo', 'Choisis une source', [
      { text: 'Galerie', onPress: () => launchPicker('library') },
      { text: 'Appareil photo', onPress: () => launchPicker('camera') },
      { text: 'Annuler', style: 'cancel' },
    ])
  }

  const launchPicker = async (source: 'library' | 'camera') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "L'accès à l'appareil photo est nécessaire.")
        return
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire.")
        return
      }
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })

    if (result.canceled) return

    setIsLoading(true)
    try {
      const uri = result.assets[0].uri

      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800, height: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      )

      const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
        encoding: 'base64' as any,
      })

      const fileName = `${user?.id}/${Date.now()}.jpg`

      const { error } = await supabase.storage
        .from('product-photo')
        .upload(fileName, decode(base64), { contentType: 'image/jpeg', upsert: true })

      if (error) throw new Error(error.message)

      const { data } = supabase.storage
        .from('product-photo')
        .getPublicUrl(fileName)

      onChange(data.publicUrl)
    } catch (err: any) {
      Alert.alert('Erreur upload', err.message ?? "Impossible d'uploader la photo.")
    } finally {
      setIsLoading(false)
    }
  }

  const borderRadius = size * 0.2

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: colors.surface2,
          borderColor: colors.border,
        },
      ]}
      onPress={pickImage}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.text3} />
      ) : value ? (
        <>
          <Image
            source={{ uri: value }}
            style={[styles.image, { borderRadius }]}
          />
          <View style={[styles.editBadge, { backgroundColor: colors.accent }]}>
            <Ionicons name="camera" size={12} color={colors.bg} />
          </View>
        </>
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="camera-outline" size={size > 80 ? 28 : 18} color={colors.text3} />
          {size > 80 && <Text style={[styles.placeholderText, { color: colors.text3 }]}>Ajouter{'\n'}une photo</Text>}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  placeholderText: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
})
