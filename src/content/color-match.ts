import { colors } from '@/theme/colors';

export const stroopColors = {
  red: { label: 'KIRMIZI', hex: '#F07167' },
  blue: { label: 'MAVİ', hex: colors.accentBlue },
  green: { label: 'YEŞİL', hex: colors.accentPrimary },
  yellow: { label: 'SARI', hex: colors.accentAmber },
} as const;

export type StroopColorKey = keyof typeof stroopColors;

export const stroopColorKeys = Object.keys(stroopColors) as StroopColorKey[];
