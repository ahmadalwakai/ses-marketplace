export const colors = {
  background: '#ffffff',
  text: '#0b0b0b',
  accent: '#00f5d4',
  border: '#0b0b0b',
  muted: '#f4f4f5',
  subtle: '#111111',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#0b0b0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
  neon: {
    shadowColor: '#00f5d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
};

export const typography = {
  heading: 22,
  subheading: 18,
  body: 15,
  small: 13,
};

export const tokens = {
  colors,
  spacing,
  radii,
  shadows,
  typography,
};

export type Tokens = typeof tokens;
