import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CharCounter } from '@/components/char-counter';
import { HeaderTextButton } from '@/components/header-text-button';
import { goHome } from '@/components/not-found';
import { PrimaryButton } from '@/components/primary-button';
import { Colors, MIN_TAP, Radius, Spacing, cardShadow } from '@/constants/theme';
import { findTopicByName, useStore } from '@/lib/store';
import { LIMITS, TOPIC_EMOJIS } from '@/lib/types';

function close() {
  if (router.canGoBack()) router.back();
  else goHome();
}

export default function NewTopicScreen() {
  const { topics, addTopic } = useStore();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<string>(TOPIC_EMOJIS[0]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const trimmed = name.trim();
  const duplicate = trimmed ? findTopicByName(topics, trimmed) : undefined;
  // Once submitted, the new topic itself would match the duplicate check, so
  // suppress the message while the modal closes.
  const error =
    busy || done ? null : duplicate ? `You already have a topic called ${trimmed}.` : submitError;
  const canCreate = trimmed.length > 0 && !duplicate && !busy && !done;

  const handleCreate = async () => {
    if (!canCreate) return;
    setBusy(true);
    const result = await addTopic(trimmed, emoji);
    setBusy(false);
    if ('error' in result) {
      setSubmitError(result.error);
      return;
    }
    setDone(true);
    close();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerLeft: () => <HeaderTextButton label="Cancel" onPress={close} />,
        }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              setSubmitError(null);
            }}
            placeholder="Topic name"
            placeholderTextColor={Colors.gray}
            maxLength={LIMITS.topicName}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleCreate}
            style={[styles.input, error ? styles.inputError : null]}
            accessibilityLabel="Topic name"
          />
          {error ? (
            <Text style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
          <CharCounter length={name.length} max={LIMITS.topicName} showWithin={6} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Emoji</Text>
          <View style={styles.emojiGrid}>
            {TOPIC_EMOJIS.map((e) => {
              const selected = e === emoji;
              return (
                <Pressable
                  key={e}
                  accessibilityRole="button"
                  accessibilityLabel={`Emoji ${e}`}
                  accessibilityState={{ selected }}
                  onPress={() => setEmoji(e)}
                  style={[styles.emojiButton, selected && styles.emojiSelected]}>
                  <Text style={styles.emoji}>{e}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewEmoji}>{emoji}</Text>
          <Text style={styles.previewName} numberOfLines={1}>
            {trimmed || 'Topic name'}
          </Text>
        </View>

        <PrimaryButton
          label="Create"
          variant="main"
          disabled={!canCreate}
          onPress={handleCreate}
          accessibilityHint={canCreate ? undefined : 'Enter a unique topic name to create it'}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray,
  },
  input: {
    minHeight: 52,
    backgroundColor: Colors.card,
    borderRadius: Radius.row,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 17,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...cardShadow,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  error: {
    fontSize: 15,
    color: Colors.danger,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  emojiButton: {
    width: 52,
    height: 52,
    minWidth: MIN_TAP,
    borderRadius: Radius.row,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  emojiSelected: {
    borderColor: Colors.main,
    backgroundColor: '#ECEBF7',
  },
  emoji: {
    fontSize: 26,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: Spacing.md,
    ...cardShadow,
  },
  previewEmoji: {
    fontSize: 28,
  },
  previewName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
});
