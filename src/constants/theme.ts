export const Colors = {
  background: '#FAF7F0',
  main: '#3D3B8E',
  accent: '#FFC857',
  text: '#1F1D36',
  gray: '#6B6880',
  danger: '#D64545',
  card: '#FFFFFF',
  border: '#E7E2D6',
} as const;

export const Radius = {
  card: 16,
  row: 12,
  chip: 999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const MIN_TAP = 44;

export const cardShadow = {
  shadowColor: '#1F1D36',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;
