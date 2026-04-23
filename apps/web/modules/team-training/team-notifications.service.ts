import type { TeamNotification } from "./team.types";
import { loadStore, saveStore, uid } from "./team-storage";

export function notifyTeam(
  teamId: string,
  input: Omit<TeamNotification, "id" | "teamId" | "createdAtIso" | "read"> & { read?: boolean },
): TeamNotification {
  const store = loadStore();
  const n: TeamNotification = {
    id: uid(),
    teamId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    createdAtIso: new Date().toISOString(),
    read: input.read ?? false,
  };
  store.notifications = [n, ...store.notifications].slice(0, 80);
  saveStore(store);
  return n;
}

export function listNotifications(teamId?: string): TeamNotification[] {
  const all = loadStore().notifications;
  if (!teamId) return all;
  return all.filter((n) => n.teamId === teamId);
}

export function markNotificationRead(id: string): void {
  const store = loadStore();
  const n = store.notifications.find((x) => x.id === id);
  if (n) n.read = true;
  saveStore(store);
}
