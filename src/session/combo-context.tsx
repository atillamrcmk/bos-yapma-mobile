import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { playComboSound, unloadComboSound } from '@/utils/combo-sound';

interface ComboContextValue {
  currentCombo: number;
  /** Monotonic key so UI can re-trigger spring on every bump (including same visual combo). */
  pulseKey: number;
  bumpCombo: () => void;
  resetCombo: () => void;
}

const ComboContext = createContext<ComboContextValue | null>(null);

export function ComboProvider({ children }: { children: ReactNode }) {
  const [currentCombo, setCurrentCombo] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    return () => {
      void unloadComboSound();
    };
  }, []);

  const bumpCombo = useCallback(() => {
    setCurrentCombo((prev) => {
      const next = prev + 1;
      void playComboSound(next);
      return next;
    });
    setPulseKey((k) => k + 1);
  }, []);

  const resetCombo = useCallback(() => {
    setCurrentCombo(0);
  }, []);

  const value = useMemo(
    () => ({ currentCombo, pulseKey, bumpCombo, resetCombo }),
    [bumpCombo, currentCombo, pulseKey, resetCombo],
  );

  return <ComboContext.Provider value={value}>{children}</ComboContext.Provider>;
}

export function useCombo(): ComboContextValue {
  const ctx = useContext(ComboContext);
  if (!ctx) {
    throw new Error('useCombo must be used within ComboProvider');
  }
  return ctx;
}

/** Safe for game components that may render outside a session (tests / previews). */
export function useOptionalCombo(): ComboContextValue | null {
  return useContext(ComboContext);
}
