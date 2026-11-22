export type Topic = {
  id: string;
  name: string;
  emoji: string;
  isPreset: boolean;
};

export type Idea = {
  id: string;
  title: string;
  details: string;
  topicId: string;
  createdAt: number;
  updatedAt: number;
};

export type AppData = {
  topics: Topic[];
  ideas: Idea[];
};

export const LIMITS = {
  topicName: 24,
  ideaTitle: 80,
  ideaDetails: 1000,
} as const;

export const RANDOM_TOPIC_ID = 'random';

export const PRESET_TOPICS: readonly Topic[] = [
  { id: 'home', name: 'Home', emoji: '🏠', isPreset: true },
  { id: 'school', name: 'School', emoji: '📚', isPreset: true },
  { id: 'work', name: 'Work', emoji: '💼', isPreset: true },
  { id: 'tech', name: 'Tech', emoji: '💻', isPreset: true },
  { id: RANDOM_TOPIC_ID, name: 'Random', emoji: '🎲', isPreset: true },
];

/** Emoji choices offered when creating a custom topic. */
export const TOPIC_EMOJIS = [
  '💡', '🎸', '🎨', '🍳', '✈️', '💪', '🎮', '🌱', '💰', '❤️', '🎬', '📷',
] as const;
