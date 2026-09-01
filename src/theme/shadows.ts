import { ViewStyle } from 'react-native';

export const shadows = {
  none: {} satisfies ViewStyle,
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
} as const;
