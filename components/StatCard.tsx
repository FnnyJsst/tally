import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors, Spacing, FontSize, Radius } from '../constants/theme'

type Props = {
  label: string
  value: string | number
  pill?: string
  pillColor?: 'green' | 'red' | 'orange' | 'white'
  dark?: boolean
  onPress?: () => void
}

export default function StatCard({ label, value, pill, pillColor = 'green', dark, onPress }: Props) {
  const pillStyles = {
    green: { bg: Colors.greenBg, text: Colors.green },
    red: { bg: Colors.redBg, text: Colors.red },
    orange: { bg: Colors.orangeBg, text: Colors.orange },
    white: { bg: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.8)' },
  }

  return (
    <TouchableOpacity
      style={[styles.card, dark && styles.cardDark]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>
      <Text style={[styles.value, dark && styles.valueDark]}>{value}</Text>
      {pill && (
        <View style={[styles.pill, { backgroundColor: pillStyles[pillColor].bg }]}>
          <Text style={[styles.pillText, { color: pillStyles[pillColor].text }]}>{pill}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flex: 1,
  },
  cardDark: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: Colors.text3,
    marginBottom: Spacing.xs,
  },
  labelDark: {
    color: 'rgba(255,255,255,0.4)',
  },
  value: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -1,
    color: Colors.text,
    lineHeight: 32,
  },
  valueDark: {
    color: 'white',
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  pillText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
})
