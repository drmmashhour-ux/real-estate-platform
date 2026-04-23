export type {
  BadgeId,
  CoachSessionFeedback,
  MemberGamification,
  MemberLeaderboardRow,
  Team,
  TeamChallenge,
  TeamMember,
  TeamNotification,
  TeamSession,
  TeamSessionResult,
  TeamTrainingMode,
} from "./team.types";

export { createTeam, addTeamMember, getTeam, listTeams, listTeamMembers } from "./team.service";
export {
  completeSessionResults,
  createTrainingSession,
  getSession,
  listSessionsForTeam,
} from "./team-session.service";
export { buildLeaderboard, improvementRateForMember, recordMemberScores } from "./team-leaderboard.service";
export {
  badgeLabel,
  awardXpForSession,
  getGamification,
  touchStreak,
} from "./team-gamification.service";
export { listNotifications, markNotificationRead, notifyTeam } from "./team-notifications.service";
export {
  ensureChallenges,
  getChallengeProgress,
  listActiveChallenges,
  bumpChallengeProgress,
} from "./team-challenges.service";
export { addCoachFeedback, listFeedbackForSession, listFeedbackForTeam } from "./team-feedback.service";
export { buildTeamPerformanceSummary } from "./team-performance.service";
export { loadStore, emptyStore } from "./team-storage";
