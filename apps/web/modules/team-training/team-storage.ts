import type {
  ChallengeProgress,
  CoachSessionFeedback,
  MemberGamification,
  Team,
  TeamChallenge,
  TeamMember,
  TeamNotification,
  TeamSession,
} from "./team.types";

const STORAGE_KEY = "lecipm-team-training-store-v1";

export type TeamTrainingStore = {
  teams: Record<string, Team>;
  members: Record<string, TeamMember>;
  sessions: Record<string, TeamSession>;
  feedback: Record<string, CoachSessionFeedback>;
  challenges: Record<string, TeamChallenge>;
  challengeProgress: Record<string, ChallengeProgress>;
  gamification: Record<string, MemberGamification>;
  notifications: TeamNotification[];
  /** memberId -> rolling scores for improvement */
  memberScoreHistory: Record<string, number[]>;
};

/** In-memory source of truth — synced to localStorage in the browser when available. */
let memoryStore: TeamTrainingStore = emptyStoreInternal();

function emptyStoreInternal(): TeamTrainingStore {
  return {
    teams: {},
    members: {},
    sessions: {},
    feedback: {},
    challenges: {},
    challengeProgress: {},
    gamification: {},
    notifications: [],
    memberScoreHistory: {},
  };
}

export function emptyStore(): TeamTrainingStore {
  return emptyStoreInternal();
}

export function loadStore(): TeamTrainingStore {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memoryStore = { ...emptyStoreInternal(), ...JSON.parse(raw) } as TeamTrainingStore;
      }
    } catch {
      /* keep memory */
    }
  }
  return memoryStore;
}

export function saveStore(store: TeamTrainingStore): void {
  memoryStore = store;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* ignore quota */
    }
  }
}

export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tt-${Date.now()}`;
}
