export type KnowledgeCategory =
  | 'technology'
  | 'history'
  | 'science'
  | 'culture'
  | 'sports'
  | 'turkey'
  | 'geography';

export type KnowledgeMetric =
  | 'year'
  | 'population'
  | 'distance'
  | 'height'
  | 'quantity';

export type KnowledgeDifficulty = 1 | 2 | 3;

export interface KnowledgeItem {
  id: string;
  label: string;
  category: KnowledgeCategory;
  metric: KnowledgeMetric;
  /** Numeric value used for ordering/comparison (same unit within a metric). */
  value: number;
  /** Human-readable value shown in feedback. */
  displayValue: string;
  /** One short sentence after the answer. */
  fact: string;
  difficulty?: KnowledgeDifficulty;
  locale?: 'tr';
  /** Editorial note; not shown in UI. */
  sourceNote?: string;
}

export type OrderPrompt =
  | 'Eskiden yeniye sırala'
  | 'Küçükten büyüğe sırala'
  | 'Alçaktan yükseğe sırala'
  | 'Kısadan uzağa sırala'
  | 'Azdan çoğa sırala';

export function promptForMetric(metric: KnowledgeMetric): OrderPrompt {
  switch (metric) {
    case 'year':
      return 'Eskiden yeniye sırala';
    case 'population':
      return 'Küçükten büyüğe sırala';
    case 'height':
      return 'Alçaktan yükseğe sırala';
    case 'distance':
      return 'Kısadan uzağa sırala';
    case 'quantity':
      return 'Azdan çoğa sırala';
  }
}
