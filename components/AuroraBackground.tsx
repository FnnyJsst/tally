import { View, StyleSheet, Dimensions } from 'react-native'
import { BlurView } from 'expo-blur'
import { useTheme } from '../contexts/ThemeContext'

const { width, height } = Dimensions.get('window')

export default function AuroraBackground({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme()

  if (!isDark) {
    return <View style={styles.light}>{children}</View>
  }

  return (
    <View style={styles.root}>
      {/* Blob violet — haut gauche */}
      <View style={[styles.blob, styles.blobViolet]} />
      {/* Blob teal — bas droite */}
      <View style={[styles.blob, styles.blobTeal]} />
      {/* Blob bleu — centre */}
      <View style={[styles.blob, styles.blobBlue]} />
      {/* Couche de flou sur les blobs */}
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
      {/* Overlay sombre pour calmer les blobs */}
      <View style={styles.overlay} />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0820',
  },
  light: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobViolet: {
    width: width * 0.85,
    height: width * 0.85,
    backgroundColor: 'rgba(120,60,255,0.45)',
    top: -width * 0.25,
    left: -width * 0.25,
  },
  blobTeal: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: 'rgba(0,200,180,0.35)',
    bottom: -width * 0.2,
    right: -width * 0.2,
  },
  blobBlue: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: 'rgba(60,120,255,0.30)',
    top: height * 0.35,
    left: width * 0.1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,8,32,0.55)',
  },
})
