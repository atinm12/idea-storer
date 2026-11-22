import { router, Stack } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderTextButton } from '@/components/header-text-button';
import { PrimaryButton } from '@/components/primary-button';
import { Colors, Radius, Spacing, cardShadow } from '@/constants/theme';
import { pluralize } from '@/lib/format';
import { effectiveTopicId, useStore } from '@/lib/store';
import type { Topic } from '@/lib/types';

export default function HomeScreen() {
  const { topics, ideas, loaded } = useStore();
  const insets = useSafeAreaInsets();

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const idea of ideas) {
      const id = effectiveTopicId(topics, idea.topicId);
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [ideas, topics]);

  // Pad to an even count so a lone last card keeps the same width as the rest.
  const gridData: (Topic | null)[] = topics.length % 2 === 0 ? topics : [...topics, null];

  const openNewIdea = () =>
    router.push({ pathname: '/idea/[id]', params: { id: 'new' } });

  const header = (
    <View style={styles.listHeader}>
      <Text style={styles.summary}>
        {pluralize(ideas.length, 'idea')} across {pluralize(topics.length, 'topic')}
      </Text>
      {loaded && ideas.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💡</Text>
          <Text style={styles.emptyText}>No ideas yet. Tap + New Idea when one hits.</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderTextButton
              label="+ Topic"
              accessibilityLabel="New topic"
              onPress={() => router.push('/topic/new')}
            />
          ),
        }}
      />
      <FlatList
        data={gridData}
        keyExtractor={(t) => t?.id ?? 'spacer'}
        numColumns={2}
        ListHeaderComponent={header}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.listContent, { paddingBottom: 56 + insets.bottom + Spacing.xl }]}
        renderItem={({ item }) =>
          item ? (
            <TopicCard topic={item} count={counts.get(item.id) ?? 0} />
          ) : (
            <View style={styles.spacer} />
          )
        }
      />
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <PrimaryButton label="+ New Idea" onPress={openNewIdea} />
      </View>
    </View>
  );
}

function TopicCard({ topic, count }: { topic: Topic; count: number }) {
  const label = `${topic.emoji} ${topic.name}, ${pluralize(count, 'idea')}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push({ pathname: '/topic/[id]', params: { id: topic.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <Text style={styles.cardEmoji}>{topic.emoji}</Text>
      <Text style={styles.cardName} numberOfLines={1}>
        {topic.name}
      </Text>
      <Text style={styles.cardCount}>{pluralize(count, 'idea')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  listHeader: {
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  summary: {
    fontSize: 15,
    color: Colors.gray,
  },
  empty: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...cardShadow,
  },
  emptyEmoji: {
    fontSize: 24,
  },
  emptyText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  row: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  card: {
    flex: 1,
    minHeight: 120,
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: Spacing.md,
    justifyContent: 'space-between',
    ...cardShadow,
  },
  spacer: {
    flex: 1,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  cardCount: {
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
