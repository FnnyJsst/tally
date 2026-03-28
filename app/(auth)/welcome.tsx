import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme'

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>T</Text>
        </View>
        <Text style={styles.title}>Votre stock,{'\n'}<Text style={styles.titleItalic}>enfin clair.</Text></Text>
        <Text style={styles.subtitle}>
          Gérez vos créations sur tous{'\n'}vos canaux de vente, en un endroit.
        </Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.btnPrimaryText}>Commencer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnGhost}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.btnGhostText}>J'ai déjà un compte</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  top: {
    alignItems: 'center',
    paddingTop: 40,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  logoText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: Spacing.md,
  },
  titleItalic: {
    fontStyle: 'italic',
    color: Colors.text2,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.text3,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottom: {
    gap: Spacing.sm,
  },
  btnPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: 'white',
    fontSize: FontSize.base,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  btnGhost: {
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnGhostText: {
    color: Colors.text2,
    fontSize: FontSize.base,
    fontWeight: '400',
  },
})
