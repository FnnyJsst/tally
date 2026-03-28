import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors, Spacing, FontSize, Radius } from '../constants/theme'

type Props = {
  name: string
  current: number
  threshold: number
  onPress: () => void
}

export default function AlertRow({ name, current, threshold, onPress }: Props) {
  const isCritical = current <= 1

  return (
    <View style={styles.row}>
      <View style={[styles.dot, isCritical ? styles.dotRed : styles.dotOrange]} />
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <Text style={styles.qty}>
        {current}/{threshold}
      </Text>
      <TouchableOpacity style={styles.btn} onPress={onPress}>
        <Text style={styles.btnText}>Maj</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    flexShrink: 0,
  },
  dotRed: { backgroundColor: Colors.red },
  dotOrange: { backgroundColor: '#E07B2A' },
  name: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  qty: {
    fontSize: FontSize.xs,
    color: Colors.text2,
    fontVariant: ['tabular-nums'],
  },
  btn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  btnText: {
    color: 'white',
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
})
