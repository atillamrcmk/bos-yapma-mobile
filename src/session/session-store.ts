import type { SessionSummary } from '@/types/session';

let lastSession: SessionSummary | null = null;

export function setLastSession(summary: SessionSummary): void {
  lastSession = summary;
}

export function getLastSession(): SessionSummary | null {
  return lastSession;
}

export function clearLastSession(): void {
  lastSession = null;
}
