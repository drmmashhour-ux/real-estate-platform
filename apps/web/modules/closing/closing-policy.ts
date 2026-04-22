import type { PlatformRole } from "@prisma/client";

export function canManageClosing(role: PlatformRole): boolean {
  return role === "BROKER" || role === "ADMIN";
}
