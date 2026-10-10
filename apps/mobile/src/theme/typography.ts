import { colors } from './colors';

export const typography = {
  screenTitle: {
    color: colors.navy,
    fontSize: 27,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  sectionTitle: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  caption: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
} as const;
