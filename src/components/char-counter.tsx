import { StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';

/** Shows "n / max" once the value is within `showWithin` characters of the limit. */
export function CharCounter({
  length,
  max,
  showWithin = 20,
}: {
  length: number;
  max: number;
  showWithin?: number;
}) {
  if (length < max - showWithin) return null;
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
    fontSize: 15,
    color: Colors.gray,
    marginTop: 4,
  },
});
