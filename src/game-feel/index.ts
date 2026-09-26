import { haptics } from '@/utils/haptics';

export const feel = {
  selection: () => haptics.selection(),
  correct: () => haptics.success(),
  perfect: () => haptics.medium(),
  warning: () => haptics.warning(),
  light: () => haptics.light(),
} as const;

export const motionMs = {
  press: 90,
  correct: 200,
  completion: 420,
  transition: 200,
} as const;
