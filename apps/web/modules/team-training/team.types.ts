/** Team training — browser-persisted until backed by org API. */

export type TeamMemberRole = "coach" | "member";

export type TeamTrainingMode = "solo" | "group" | "competitive";

export type TeamMember = {
  memberId: string;
  teamId: string;
  displayName: string;
  email?: string;
  role: TeamMemberRole;
  joinedAtIso: string;
};

export type Team = {
  teamId: string;
  name: string;
  coachId: string;
  memberIds: string[];
  createdAtIso: string;
};

/** One structured practice run for the team (scenario lab or logged outcome). */
export type TeamSessionResult = {
  memberId: string;
  /** Raw training score average where available */
  avgScore: number;
  /** 0–1 closed won / demo booked heuristic */
  closingRate: number;
  /** From scenario composite or control heuristic 0–100 */
  controlScore: number;
  /** Delta vs member rolling average at time of session */
  improvementDelta: number;
  scenarioId?: string;
  won: boolean;
};

export type TeamSession = {
  sessionId: string;
  teamId: string;
  /** Linked training scenario id when applicable */
  scenarioId?: string;
  mode: TeamTrainingMode;
  participantMemberIds: string[];
  startedAtIso: string;
  endedAtIso?: string;
  /** Per-member outcome */
  results: TeamSessionResult[];
  notes?: string;
};

export type CoachSessionFeedback = {
  feedbackId: string;
  sessionId: string;
  coachId: string;
  comment: string;
  highlights: string[];
  mistakes: string[];
  createdAtIso: string;
};

export type ChallengeCadence = "daily" | "weekly";

export type TeamChallenge = {
  challengeId: string;
  cadence: ChallengeCadence;
  title: string;
  description: string;
  /** e.g. scenario tag or difficulty */
  targetScenarioId?: string;
  targetDifficulty?: string;
  targetCount: number;
  startsAtIso: string;
  endsAtIso: string;
};

export type ChallengeProgress = {
  challengeId: string;
  memberId: string;
  currentCount: number;
  completedAtIso?: string;
};

export type BadgeId =
  | "first_session"
  | "streak_3"
  | "streak_7"
  | "closer"
  | "extreme_survivor"
  | "team_player";

export type MemberGamification = {
  memberId: string;
  xp: number;
  level: number;
  badges: BadgeId[];
  streakDays: number;
  lastPracticeDate?: string;
};

export type TeamNotification = {
  id: string;
  teamId: string;
  kind: "challenge" | "rank" | "coach_feedback" | "general";
  title: string;
  body: string;
  createdAtIso: string;
  read: boolean;
};

export type MemberLeaderboardRow = {
  rank: number;
  memberId: string;
  displayName: string;
  avgScore: number;
  closingRate: number;
  controlScore: number;
  improvementRate: number;
  sessionsCount: number;
};
