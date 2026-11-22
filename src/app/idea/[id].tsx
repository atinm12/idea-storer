import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CharCounter } from '@/components/char-counter';
import { goHome, NotFound } from '@/components/not-found';
import { PrimaryButton } from '@/components/primary-button';
import { Colors, MIN_TAP, Radius, Spacing, cardShadow } from '@/constants/theme';
import { effectiveTopicId, useStore } from '@/lib/store';
import { LIMITS, RANDOM_TOPIC_ID, type Idea, type Topic } from '@/lib/types';

function goBack() {
  if (router.canGoBack()) router.back();
  else goHome();
}

export default function IdeaEditorScreen() {
  const { id, topicId } = useLocalSearchParams<{ id: string; topicId?: string }>();
  const { ideas, topics, loaded } = useStore();
  const [leaving, setLeaving] = useState(false);

  if (!loaded || leaving) return null;

  const isNew = id === 'new';
  const idea = isNew ? undefined : ideas.find((i) => i.id === id);
  if (!isNew && !idea) return <NotFound message="This idea doesn't exist anymore" />;

  const initialTopicId = idea
    ? effectiveTopicId(topics, idea.topicId)
    : topicId && topics.some((t) => t.id === topicId)
      ? topicId
      : null;

  // Keyed so the form state resets if the route params change.
  return (
    <IdeaForm
      key={idea?.id ?? 'new'}
      idea={idea}
      topics={topics}
      initialTopicId={initialTopicId}
      onLeaving={() => setLeaving(true)}
    />
  );
}

function IdeaForm({
  idea,
  topics,
  initialTopicId,
  onLeaving,
}: {
  idea?: Idea;
  topics: Topic[];
  initialTopicId: string | null;
  onLeaving: () => void;
}) {
  const { addIdea, updateIdea, deleteIdea } = useStore();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState(idea?.title ?? '');
  const [details, setDetails] = useState(idea?.details ?? '');
  const [pickedTopicId, setPickedTopicId] = useState<string | null>(initialTopicId);
  // After a new idea is created once, retries update it instead of duplicating it.
  const [savedId, setSavedId] = useState<string | null>(idea?.id ?? null);
  const [busy, setBusy] = useState(false);

  const canSave = title.trim().length > 0 && !busy;
  const randomTopic = topics.find((t) => t.id === RANDOM_TOPIC_ID);

  const handleSave = async () => {
    if (!canSave) return;
    setBusy(true);
    const input = { title, details, topicId: pickedTopicId };
    let ok: boolean;
    if (savedId) {
      ok = await updateIdea(savedId, input);
    } else {
      // If the write fails the store shows an alert; the idea stays in memory
      // and Save stays available to retry (as an update, not a duplicate).
      const result = await addIdea(input);
      if (result.id) setSavedId(result.id);
      ok = result.saved;
    }
    setBusy(false);
    if (ok) goBack();
  };

  const confirmDelete = () => {
    if (!idea) return;
    Alert.alert('Delete this idea?', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          onLeaving();
          await deleteIdea(idea.id);
          goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: idea ? 'Edit Idea' : 'New Idea' }} />
      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}>
        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What's the idea?"
            placeholderTextColor={Colors.gray}
            maxLength={LIMITS.ideaTitle}
            autoFocus={!idea}
            returnKeyType="next"
            style={[styles.input, styles.titleInput]}
            accessibilityLabel="Idea title"
          />
          <CharCounter length={title.length} max={LIMITS.ideaTitle} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Details</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Details, how it would work, why it matters..."
            placeholderTextColor={Colors.gray}
            maxLength={LIMITS.ideaDetails}
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.detailsInput]}
            accessibilityLabel="Idea details"
          />
          <CharCounter length={details.length} max={LIMITS.ideaDetails} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Topic</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.chips}
            style={styles.chipScroller}>
            {topics.map((t) => {
              const selected = t.id === pickedTopicId;
              return (
                <Pressable
                  key={t.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.name} topic`}
                  accessibilityState={{ selected }}
                  onPress={() => setPickedTopicId(t.id)}
                  style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {t.emoji} {t.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {pickedTopicId === null && randomTopic ? (
            <Text style={styles.hint}>
              No topic picked yet. It&apos;ll go in {randomTopic.emoji} {randomTopic.name}.
            </Text>
          ) : null}
        </View>

        <PrimaryButton
          label="Save"
          variant="main"
          disabled={!canSave}
          onPress={handleSave}
          accessibilityHint={canSave ? undefined : 'Add a title to save'}
          style={styles.save}
        />

        {idea ? (
          <Pressable
            accessibilityRole="button"
            onPress={confirmDelete}
            style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.5 }]}>
            <Text style={styles.deleteText}>Delete idea</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
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
    backgroundColor: Colors.card,
    borderRadius: Radius.row,
    paddingHorizontal: Spacing.md,
    fontSize: 17,
    color: Colors.text,
    ...cardShadow,
  },
  titleInput: {
    minHeight: 52,
    paddingVertical: 14,
  },
  detailsInput: {
    minHeight: 140,
    paddingTop: 14,
    paddingBottom: 14,
  },
  chipScroller: {
    marginHorizontal: -Spacing.md,
  },
  chips: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    gap: Spacing.sm,
  },
  chip: {
    minHeight: MIN_TAP,
    paddingHorizontal: 14,
    borderRadius: Radius.chip,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.main,
    borderColor: Colors.main,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 13,
    color: Colors.gray,
  },
  save: {
    marginTop: Spacing.sm,
  },
  deleteButton: {
    minHeight: MIN_TAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.danger,
  },
});
