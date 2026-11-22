import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  LIMITS,
  PRESET_TOPICS,
  TOPIC_EMOJIS,
  type AppData,
  type Idea,
  type Topic,
} from './types';

export const STORAGE_KEY = 'idea-storer/v1';

const ALLOWED_EMOJIS = new Set<string>([
  ...TOPIC_EMOJIS,
  ...PRESET_TOPICS.map((t) => t.emoji),
]);

export function defaultData(): AppData {
  return { topics: PRESET_TOPICS.map((t) => ({ ...t })), ideas: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseTopic(raw: unknown): Topic | null {
  if (!isRecord(raw)) return null;
  const { id, name, emoji } = raw;
  if (typeof id !== 'string' || id.length === 0) return null;
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > LIMITS.topicName) return null;
  if (typeof emoji !== 'string' || !ALLOWED_EMOJIS.has(emoji)) return null;
  return { id, name: trimmed, emoji, isPreset: false };
}

function parseIdea(raw: unknown): Idea | null {
  if (!isRecord(raw)) return null;
  const { id, title, details, topicId, createdAt, updatedAt } = raw;
  if (typeof id !== 'string' || id.length === 0) return null;
  if (typeof title !== 'string') return null;
  const cleanTitle = title.trim().slice(0, LIMITS.ideaTitle);
  if (cleanTitle.length === 0) return null;
  if (typeof topicId !== 'string') return null;
  const created =
    typeof createdAt === 'number' && Number.isFinite(createdAt) ? createdAt : Date.now();
  const updated =
    typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : created;
  return {
    id,
    title: cleanTitle,
    details: typeof details === 'string' ? details.slice(0, LIMITS.ideaDetails) : '',
    topicId,
    createdAt: created,
    updatedAt: updated,
  };
}

/**
 * Validates untrusted JSON from storage. Presets always come from code (so they
 * can't be renamed or removed by tampering); custom topics and ideas are kept
 * only if they're well-formed.
 */
export function sanitizeData(raw: unknown): AppData {
  const base = defaultData();
  if (!isRecord(raw)) return base;

  const presetIds = new Set(base.topics.map((t) => t.id));
  const seenTopicIds = new Set(presetIds);
  const seenNames = new Set(base.topics.map((t) => t.name.toLowerCase()));
  const customTopics: Topic[] = [];
  if (Array.isArray(raw.topics)) {
    for (const item of raw.topics) {
      const topic = parseTopic(item);
      if (!topic) continue;
      const lower = topic.name.toLowerCase();
      if (seenTopicIds.has(topic.id) || seenNames.has(lower)) continue;
      seenTopicIds.add(topic.id);
      seenNames.add(lower);
      customTopics.push(topic);
    }
  }

  const ideas: Idea[] = [];
  const seenIdeaIds = new Set<string>();
  if (Array.isArray(raw.ideas)) {
    for (const item of raw.ideas) {
      const idea = parseIdea(item);
      if (!idea || seenIdeaIds.has(idea.id)) continue;
      seenIdeaIds.add(idea.id);
      ideas.push(idea);
    }
  }

  return { topics: [...base.topics, ...customTopics], ideas };
}

export async function loadData(): Promise<AppData> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json == null) return defaultData();
    return sanitizeData(JSON.parse(json));
  } catch (error) {
    console.warn('[idea-storer] Failed to load saved data; starting fresh.', error);
    return defaultData();
  }
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
