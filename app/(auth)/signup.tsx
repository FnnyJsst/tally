import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  ScrollView, Alert
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../stores/useAuthStore'
import { supabase } from '../../lib/supabase'
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme'

const ACTIVITY_TYPES = ['Bijoux', 'Textile', 'Déco', 'Mobilier', 'Céramique', 'Autre']

export default function SignupScreen() {
  const router = useRouter()
  const { signUp, isLoading } = useAuthStore()

  const [step, setStep] = useState(1) // 1 = compte, 2 = profil boutique
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shopName, setShopName] = useState('')
  const [activityType, setActivityType] = useState('')

  const handleStep1 = () => {
    if (!email || !password) {
      Alert.alert('Champs manquants', 'Merci de remplir tous les champs.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Il doit faire au moins 6 caractères.')
      return
    }
    setStep(2)
  }

  const handleSignup = async () => {
    if (!shopName) {
      Alert.alert('Champs manquants', 'Donne un nom à ta boutique.')
      return
    }

    const { error } = await signUp(email, password)
    if (error) {
      Alert.alert('Erreur', error)
      return
    }

    // Met à jour le profil avec le nom de boutique et le type
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('users')
        .update({ shop_name: shopName, activity_type: activityType })
        .eq('id', user.id)
    }

    // Redirection gérée par le Root layout
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => step === 1 ? router.back() : setStep(1)}
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        {/* Indicateur d'étape */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
        </View>

        {step === 1 ? (
          <View style={styles.content}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Tu rejoins Tally en quelques secondes</Text>

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
                  placeholder="6 caractères minimum"
                  placeholderTextColor={Colors.text3}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleStep1}>
              <Text style={styles.btnPrimaryText}>Continuer</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.switchText}>
                Déjà un compte ?{' '}
                <Text style={styles.switchLink}>Se connecter</Text>
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.title}>Ta boutique</Text>
            <Text style={styles.subtitle}>Quelques infos pour personnaliser Tally</Text>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nom de la boutique</Text>
                <TextInput
                  style={styles.input}
                  value={shopName}
                  onChangeText={setShopName}
                  placeholder="Loop Studio"
                  placeholderTextColor={Colors.text3}
                  autoCorrect={false}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Type de créations</Text>
                <View style={styles.chipRow}>
                  {ACTIVITY_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.chip, activityType === type && styles.chipSelected]}
                      onPress={() => setActivityType(type)}
                    >
                      <Text style={[
                        styles.chipText,
                        activityType === type && styles.chipTextSelected
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.btnPrimaryText}>
                {isLoading ? 'Création...' : 'Créer mon compte'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    marginBottom: Spacing.lg,
  },
  backText: {
    fontSize: FontSize.base,
    color: Colors.text2,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  stepDot: {
    height: 3,
    width: 12,
    borderRadius: 99,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    width: 24,
    backgroundColor: Colors.accent,
  },
  content: {
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text2,
  },
  chipTextSelected: {
    color: 'white',
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
