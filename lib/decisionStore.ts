import type { Decision } from "@/src/feed/types";

interface StoredDecision {
  decision: Decision;
  context: {
    currentTime: string;
    location: string;
    nextMeeting: string | null;
    nextMeetingTime: string | null;
    availableMinutes: number;
    budget: number;
  };
  source: string;
  createdAt: number;
}

const store = new Map<string, StoredDecision>();

export function saveDecision(decisionId: string, data: StoredDecision) {
  store.set(decisionId, data);
}

export function getDecision(decisionId: string): StoredDecision | undefined {
  return store.get(decisionId);
}

export function getAllDecisions(): StoredDecision[] {
  return Array.from(store.values()).sort((a, b) => b.createdAt - a.createdAt);
}
