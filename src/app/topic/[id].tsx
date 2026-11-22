import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderTextButton } from '@/components/header-text-button';
import { goHome, NotFound } from '@/components/not-found';
import { PrimaryButton } from '@/components/primary-button';
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
import { firstLine, shortDate } from '@/lib/format';
import { effectiveTopicId, useStore } from '@/lib/store';
import type { Idea, Topic } from '@/lib/types';

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { topics, ideas, loaded, deleteTopic } = useStore();
  const [leaving, setLeaving] = useState(false);

  const topic = topics.find((t) => t.id === id);

  const topicIdeas = useMemo(
    () =>
      topic
        ? ideas
            .filter((i) => effectiveTopicId(topics, i.topicId) === topic.id)
            .sort((a, b) => b.createdAt - a.createdAt)
        : [],
    [ideas, topics, topic],
  );

  if (!loaded || leaving) return null;
  if (!topic) return <NotFound message="This topic doesn't exist anymore" />;

  const confirmDelete = () => {
    const count = topicIdeas.length;
    const moveNote =
      count > 0
        ? ` Its ${count === 1 ? 'idea' : `${count} ideas`} will move to 🎲 Random.`
        : '';
    Alert.alert(`Delete ${topic.name}?`, `This can't be undone.${moveNote}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // If the write fails, the store rolls back and alerts, so stay here.
          const ok = await deleteTopic(topic.id);
          if (ok) {
            setLeaving(true);
            goHome();
          }
        },
      },
    ]);
  };

  return (
    <TopicContent
      topic={topic}
      ideas={topicIdeas}
      onDelete={topic.isPreset ? undefined : confirmDelete}
    />
  );
}

function TopicContent({
  topic,
  ideas,
  onDelete,
}: {
  topic: Topic;
  ideas: Idea[];
  onDelete?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `${topic.emoji} ${topic.name}`,
          headerRight: onDelete
            ? () => (
                <HeaderTextButton
                  label="Delete"
                  color={Colors.danger}
                  accessibilityLabel={`Delete topic ${topic.name}`}
                  onPress={onDelete}
                />
              )
            : undefined,
        }}
      />
      <FlatList
        data={ideas}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 56 + insets.bottom + Spacing.xl },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{topic.emoji}</Text>
            <Text style={styles.emptyText}>Nothing in {topic.name} yet.</Text>
          </View>
        }
        renderItem={({ item }) => <IdeaRow idea={item} />}
      />
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <PrimaryButton
          label="+ Add idea here"
          onPress={() =>
            router.push({ pathname: '/idea/[id]', params: { id: 'new', topicId: topic.id } })
          }
        />
      </View>
    </View>
  );
}

function IdeaRow({ idea }: { idea: Idea }) {
  const preview = firstLine(idea.details);
  const date = shortDate(idea.createdAt);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${idea.title}${preview ? `. ${preview}` : ''}. ${date}`}
      onPress={() => router.push({ pathname: '/idea/[id]', params: { id: idea.id } })}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1} ellipsizeMode="tail">
          {idea.title}
        </Text>
        {preview ? (
          <Text style={styles.rowDetails} numberOfLines={1} ellipsizeMode="tail">
            {preview}
          </Text>
        ) : null}
      </View>
      <Text style={styles.rowDate}>{date}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm + 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 44,
  },
  emptyText: {
    fontSize: 17,
    color: Colors.gray,
    textAlign: 'center',
  },
  row: {
    minHeight: 64,
    backgroundColor: Colors.card,
    borderRadius: Radius.row,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...cardShadow,
  },
  rowPressed: {
    opacity: 0.8,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  rowDetails: {
    fontSize: 15,
    color: Colors.gray,
  },
  rowDate: {
    fontSize: 15,
    color: Colors.gray,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.background,
  },
});
