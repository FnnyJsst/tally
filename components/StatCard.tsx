import { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../contexts/ThemeContext'
import { Spacing, FontSize, Radius, FontFamily, type ColorScheme } from '../constants/theme'

type Props = {
  label: string
  value: string | number
  icon: keyof typeof Ionicons.glyphMap
  iconBg: string
  iconColor: string
  actionLabel: string
  onAction: () => void
  dark?: boolean
  onPress?: () => void
}

export default function StatCard({
  label, value, icon, iconBg, iconColor,
  actionLabel, onAction, dark, onPress,
}: Props) {
  const { colors, isDark } = useTheme()
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark])

  return (
    <TouchableOpacity
      style={[styles.card, dark && styles.cardDark]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBubble, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        <TouchableOpacity
          style={[styles.actionBtn, dark && styles.actionBtnDark]}
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, dark && styles.actionTextDark]}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.value, dark && styles.valueDark]}>
        {value}
      </Text>
      <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>
    </TouchableOpacity>
  )
}

function makeStyles(colors: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      flex: 1,
      gap: Spacing.sm,
      minHeight: 140,
      overflow: 'hidden',
    },
    cardDark: {
      backgroundColor: isDark ? 'rgba(155,127,212,0.18)' : colors.accent,
      borderColor: isDark ? 'rgba(155,127,212,0.35)' : colors.accent,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    iconBubble: {
      width: 36,
      height: 36,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtn: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 5,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    actionBtnDark: {
      borderColor: 'rgba(255,255,255,0.25)',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    actionText: {
      fontSize: FontSize.xs,
      fontWeight: '500',
      color: colors.text3,
    },
    actionTextDark: {
      color: 'rgba(255,255,255,0.85)',
    },
    value: {
      fontSize: 32,
      // fontFamily: FontFamily.display,
      letterSpacing: -0.5,
      color: colors.text,
      lineHeight: 36,
      marginTop: Spacing.xs,
      fontWeight: '300',
    },
    valueDark: {
      color: '#FFFFFF',
    },
    label: {
      fontSize: FontSize.sm,
      fontWeight: '500',
      color: colors.text3,
      marginTop: -10
    },
    labelDark: {
      color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.75)',
    },
  })
}
