import { StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';

/** Shows "n / max" once the value is within 20 characters of the limit. */
export function CharCounter({ length, max }: { length: number; max: number }) {
  if (length < max - 20) return null;
  const atLimit = length >= max;
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={[styles.counter, atLimit && { color: Colors.danger }]}>
      {length} / {max}
    </Text>
  );
}

const styles = StyleSheet.create({
  counter: {
    alignSelf: 'flex-end',
    fontSize: 13,
    color: Colors.gray,
    marginTop: 4,
  },
});
