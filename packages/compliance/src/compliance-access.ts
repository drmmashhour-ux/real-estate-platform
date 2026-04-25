import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import type { SessionUser } from "@/lib/auth/get-session";

export async function assertComplianceOwnerAccess(
  user: SessionUser,
  ownerType: string,
  ownerId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (await isPlatformAdmin(user.id)) {
    return { ok: true };
  }
  if (ownerType === "solo_broker" && ownerId === user.id) {
    return { ok: true };
  }
  if (ownerType === "platform" && ownerId === user.id) {
    return { ok: true };
  }
  if (ownerType === "agency") {
    return { ok: false, message: "Agency-scoped actions require admin in this release." };
  }
  return { ok: false, message: "Forbidden" };
}
