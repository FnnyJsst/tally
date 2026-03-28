import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/useAuthStore'
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn, isLoading } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Champs manquants', 'Merci de remplir tous les champs.')
      return
    }

    const { error } = await signIn(email, password)
    if (error) {
      Alert.alert('Erreur de connexion', error)
    }
    // La redirection est gérée automatiquement par le Root layout
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Bon retour</Text>
        <Text style={styles.subtitle}>Connecte-toi à ton compte Tally</Text>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="fanny@loop.fr"
              placeholderTextColor={Colors.text3}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.text3}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.btnPrimaryText}>
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/signup')}>
          <Text style={styles.switchText}>
            Pas encore de compte ?{' '}
            <Text style={styles.switchLink}>S'inscrire</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: 48,
  },
  back: {
    marginBottom: Spacing.xl,
  },
  backText: {
    fontSize: FontSize.base,
    color: Colors.text2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '300',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.text3,
    marginTop: -Spacing.sm,
  },
  form: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  fieldGroup: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: Colors.text3,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.text,
  },
  btnPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: 'white',
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  switchText: {
    fontSize: FontSize.sm,
    color: Colors.text3,
    textAlign: 'center',
  },
  switchLink: {
    color: Colors.text,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
})
