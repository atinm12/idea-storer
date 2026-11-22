import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, MIN_TAP } from '@/constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  color?: string;
  accessibilityLabel?: string;
};

export function HeaderTextButton({ label, onPress, color = Colors.main, accessibilityLabel }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TAP,
    minWidth: MIN_TAP,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.5,
  },
});
