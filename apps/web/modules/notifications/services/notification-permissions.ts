import type { ActionQueueItem, Notification, User } from "@prisma/client";

type MinimalUser = Pick<User, "id" | "role">;

export function canViewNotification(user: MinimalUser, n: Pick<Notification, "userId">): boolean {
  if (user.role === "ADMIN") return true;
  return n.userId === user.id;
}

export function canManageNotification(user: MinimalUser, n: Pick<Notification, "userId">): boolean {
  return canViewNotification(user, n);
}

export function canViewActionQueueItem(user: MinimalUser, item: Pick<ActionQueueItem, "userId">): boolean {
  if (user.role === "ADMIN") return true;
  return item.userId === user.id;
}

export function canManageActionQueueItem(user: MinimalUser, item: Pick<ActionQueueItem, "userId">): boolean {
  return canViewActionQueueItem(user, item);
}
