import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  LIMITS,
  PRESET_TOPICS,
  type AppData,
  type Idea,
  type Topic,
} from './types';

export const STORAGE_KEY = 'idea-storer/v1';

export const BACKUP_KEY_PREFIX = 'idea-storer/backup-';

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
  // Any short emoji string is fine, so changing the picker list later never drops topics.
  if (typeof emoji !== 'string' || emoji.length === 0 || emoji.length > 16) return null;
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
  if (!isRecord(raw)) {
    console.warn('[idea-storer] Saved data had the wrong shape; starting from presets.');
    return base;
  }

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

  const rawTopicCount = Array.isArray(raw.topics) ? raw.topics.length : 0;
  const rawIdeaCount = Array.isArray(raw.ideas) ? raw.ideas.length : 0;
  const droppedTopics = rawTopicCount - presetIdsIn(raw.topics, presetIds) - customTopics.length;
  const droppedIdeas = rawIdeaCount - ideas.length;
  if (droppedTopics > 0 || droppedIdeas > 0) {
    console.warn(
      `[idea-storer] Skipped ${droppedTopics} bad topic(s) and ${droppedIdeas} bad idea(s) while loading.`,
    );
  }

  return { topics: [...base.topics, ...customTopics], ideas };
}

/** How many saved topics are presets (those are rebuilt from code, not "dropped"). */
function presetIdsIn(rawTopics: unknown, presetIds: Set<string>): number {
  if (!Array.isArray(rawTopics)) return 0;
  return rawTopics.filter((t) => isRecord(t) && typeof t.id === 'string' && presetIds.has(t.id))
    .length;
}

async function readRaw(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch (firstError) {
    console.warn('[idea-storer] Read failed, retrying once.', firstError);
    return AsyncStorage.getItem(STORAGE_KEY);
  }
}

/**
 * Loads saved data. If the saved JSON is broken, a copy of it is stored under a
 * backup key first, so the next save can't silently wipe the only copy.
 */
export async function loadData(): Promise<AppData> {
  let json: string | null;
  try {
    json = await readRaw();
  } catch (error) {
    console.warn('[idea-storer] Failed to read saved data; starting from presets.', error);
    return defaultData();
  }
  if (json == null) return defaultData();
  try {
    return sanitizeData(JSON.parse(json));
  } catch (error) {
    console.warn('[idea-storer] Saved data was broken; backing it up and starting fresh.', error);
    try {
      await AsyncStorage.setItem(`${BACKUP_KEY_PREFIX}${Date.now()}`, json);
    } catch (backupError) {
      console.warn('[idea-storer] Could not back up broken data.', backupError);
    }
    return defaultData();
  }
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
