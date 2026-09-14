export type { KnowledgeCategory, KnowledgeDifficulty, KnowledgeItem, KnowledgeMetric, OrderPrompt } from '@/content/knowledge/types';
export { KNOWLEDGE_CATEGORY_LABEL, promptForMetric } from '@/content/knowledge/types';
export { knowledgeItems, knowledgeItemById } from '@/content/knowledge/items';
export {
  buildWhichCameFirstChallenge,
  type WhichCameFirstChallenge,
} from '@/content/knowledge/which-came-first-challenge';
export {
  buildOrderThreeChallenge,
  evaluateOrderThree,
  type OrderThreeChallenge,
  type OrderThreeEvaluation,
} from '@/content/knowledge/order-three-challenge';
