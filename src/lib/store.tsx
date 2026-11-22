import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Alert } from 'react-native';

import { defaultData, loadData, saveData } from './storage';
import {
  LIMITS,
  RANDOM_TOPIC_ID,
  type AppData,
  type Idea,
  type Topic,
} from './types';

type IdeaInput = { title: string; details: string; topicId: string | null };

type StoreValue = {
  loaded: boolean;
  topics: Topic[];
  ideas: Idea[];
  /**
   * Returns the created idea's id (null if input was invalid) and whether it was
   * written to storage. The idea stays in memory even when the write fails.
   */
  addIdea: (input: IdeaInput) => Promise<{ id: string | null; saved: boolean }>;
  updateIdea: (id: string, input: IdeaInput) => Promise<boolean>;
  deleteIdea: (id: string) => Promise<boolean>;
  /** Returns the created topic id, or an error message. */
  addTopic: (name: string, emoji: string) => Promise<{ id: string } | { error: string }>;
  deleteTopic: (id: string) => Promise<boolean>;
};

const StoreContext = createContext<StoreValue | null>(null);

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function findTopicByName(topics: Topic[], name: string): Topic | undefined {
  const lower = name.trim().toLowerCase();
  return topics.find((t) => t.name.toLowerCase() === lower);
}

/** The topic an idea actually belongs to (orphans fall back to Random). */
export function effectiveTopicId(topics: Topic[], topicId: string): string {
  return topics.some((t) => t.id === topicId) ? topicId : RANDOM_TOPIC_ID;
}

export function StoreProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<AppData>(defaultData);
  const [loaded, setLoaded] = useState(false);
  // Always-current copy so actions never compute from a stale render.
  const dataRef = useRef<AppData>(data);
  // Writes are chained so they land in order.
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    loadData().then((loadedData) => {
      if (cancelled) return;
      dataRef.current = loadedData;
      setData(loadedData);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback(async (next: AppData): Promise<boolean> => {
    dataRef.current = next;
    setData(next);
    const write = saveQueue.current.then(() => saveData(next));
    saveQueue.current = write.catch(() => undefined);
    try {
      await write;
      return true;
    } catch (error) {
      console.warn('[idea-storer] Failed to save data.', error);
      Alert.alert("Couldn't save. Try again.");
      return false;
    }
  }, []);

  const resolveTopicId = useCallback((topicId: string | null): string => {
    if (topicId && dataRef.current.topics.some((t) => t.id === topicId)) return topicId;
    return RANDOM_TOPIC_ID;
  }, []);

  const addIdea = useCallback<StoreValue['addIdea']>(
    async (input) => {
      const title = input.title.trim().slice(0, LIMITS.ideaTitle);
      if (!title) return { id: null, saved: false };
      const now = Date.now();
      const idea: Idea = {
        id: makeId(),
        title,
        details: input.details.slice(0, LIMITS.ideaDetails).trimEnd(),
        topicId: resolveTopicId(input.topicId),
        createdAt: now,
        updatedAt: now,
      };
      const current = dataRef.current;
      const saved = await commit({ ...current, ideas: [...current.ideas, idea] });
      return { id: idea.id, saved };
    },
    [commit, resolveTopicId],
  );

  const updateIdea = useCallback<StoreValue['updateIdea']>(
    async (id, input) => {
      const title = input.title.trim().slice(0, LIMITS.ideaTitle);
      const current = dataRef.current;
      if (!title || !current.ideas.some((i) => i.id === id)) return false;
      const topicId = resolveTopicId(input.topicId);
      const details = input.details.slice(0, LIMITS.ideaDetails).trimEnd();
      return commit({
        ...current,
        ideas: current.ideas.map((i) =>
          i.id === id ? { ...i, title, details, topicId, updatedAt: Date.now() } : i,
        ),
      });
    },
    [commit, resolveTopicId],
  );

  const deleteIdea = useCallback<StoreValue['deleteIdea']>(
    async (id) => {
      const current = dataRef.current;
      return commit({ ...current, ideas: current.ideas.filter((i) => i.id !== id) });
    },
    [commit],
  );

  const addTopic = useCallback<StoreValue['addTopic']>(
    async (rawName, emoji) => {
      const name = rawName.trim();
      const current = dataRef.current;
      if (!name) return { error: 'Give your topic a name.' };
      if (name.length > LIMITS.topicName) {
        return { error: `Topic names can be up to ${LIMITS.topicName} characters.` };
      }
      if (findTopicByName(current.topics, name)) {
        return { error: `You already have a topic called ${name}.` };
      }
      const topic: Topic = { id: makeId(), name, emoji, isPreset: false };
      await commit({ ...current, topics: [...current.topics, topic] });
      return { id: topic.id };
    },
    [commit],
  );

  const deleteTopic = useCallback<StoreValue['deleteTopic']>(
    async (id) => {
      const current = dataRef.current;
      const topic = current.topics.find((t) => t.id === id);
      if (!topic || topic.isPreset) return false;
      return commit({
        topics: current.topics.filter((t) => t.id !== id),
        ideas: current.ideas.map((i) =>
          i.topicId === id ? { ...i, topicId: RANDOM_TOPIC_ID } : i,
        ),
      });
    },
    [commit],
  );

  const value = useMemo<StoreValue>(
    () => ({
      loaded,
      topics: data.topics,
      ideas: data.ideas,
      addIdea,
      updateIdea,
      deleteIdea,
      addTopic,
      deleteTopic,
    }),
    [loaded, data, addIdea, updateIdea, deleteIdea, addTopic, deleteTopic],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>.');
  return ctx;
}
