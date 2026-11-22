import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { Colors, Spacing } from '@/constants/theme';

export function goHome() {
  if (router.canDismiss()) {
    router.dismissTo('/');
  } else {
    router.replace('/');
  }
}

export function NotFound({ message }: { message: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + Spacing.md }]}>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Text style={styles.emoji}>🤔</Text>
      <Text style={styles.message}>{message}</Text>
      <PrimaryButton label="Back to Home" variant="main" onPress={goHome} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  emoji: {
    fontSize: 48,
  },
  message: {
    fontSize: 17,
    color: Colors.text,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
