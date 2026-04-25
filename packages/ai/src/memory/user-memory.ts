/**
 * Lightweight user prefs for AI context (extend when product stores explicit AI prefs).
 */
export type UserMemorySnapshot = {
  role: string | null;
  bnhubHost: boolean;
};

export function buildUserMemoryFromRole(role: string | null, listingCount: number): UserMemorySnapshot {
  return {
    role,
    bnhubHost: listingCount > 0 || role === "HOST" || role === "ADMIN",
  };
}
