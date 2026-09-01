import { TextStyle } from 'react-native';

import { colors } from './colors';

export const typography = {
  hero: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textPrimary,
  } satisfies TextStyle,
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textPrimary,
  } satisfies TextStyle,
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary,
  } satisfies TextStyle,
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textSecondary,
  } satisfies TextStyle,
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  } satisfies TextStyle,
  metric: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
  metricSmall: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
  button: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.backgroundPrimary,
  } satisfies TextStyle,
} as const;
