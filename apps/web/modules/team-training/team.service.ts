import type { Team, TeamMember } from "./team.types";
import { loadStore, saveStore, uid } from "./team-storage";

export function createTeam(input: {
  name: string;
  coachId: string;
  coachDisplayName?: string;
}): Team {
  const store = loadStore();
  const teamId = uid();
  const coachMemberId = uid();
  const team: Team = {
    teamId,
    name: input.name.trim(),
    coachId: input.coachId,
    memberIds: [coachMemberId],
    createdAtIso: new Date().toISOString(),
  };
  const coach: TeamMember = {
    memberId: coachMemberId,
    teamId,
    displayName: input.coachDisplayName?.trim() || "Coach",
    role: "coach",
    joinedAtIso: team.createdAtIso,
  };
  store.teams[teamId] = team;
  store.members[coachMemberId] = coach;
  saveStore(store);
  return team;
}

export function addTeamMember(teamId: string, input: { displayName: string; email?: string }): TeamMember | null {
  const store = loadStore();
  const team = store.teams[teamId];
  if (!team) return null;
  const memberId = uid();
  const m: TeamMember = {
    memberId,
    teamId,
    displayName: input.displayName.trim(),
    email: input.email?.trim(),
    role: "member",
    joinedAtIso: new Date().toISOString(),
  };
  store.members[memberId] = m;
  team.memberIds.push(memberId);
  saveStore(store);
  return m;
}

export function getTeam(teamId: string): Team | undefined {
  return loadStore().teams[teamId];
}

export function listTeams(): Team[] {
  return Object.values(loadStore().teams).sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
}

export function listTeamMembers(teamId: string): TeamMember[] {
  const store = loadStore();
  const team = store.teams[teamId];
  if (!team) return [];
  return team.memberIds.map((id) => store.members[id]).filter(Boolean);
}
