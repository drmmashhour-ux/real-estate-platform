import type { LecipmBrokerListingThread, PlatformRole } from "@prisma/client";
import { hashGuestToken } from "@/lib/messages/guest-token";

export type ThreadViewer =
  | { kind: "broker"; userId: string }
  | { kind: "customer"; userId: string }
  | { kind: "admin"; userId: string }
  /** Raw token from the initial create response or ?guestToken= */
  | { kind: "guest"; guestToken: string };

export function canViewThread(
  thread: Pick<LecipmBrokerListingThread, "brokerUserId" | "customerUserId" | "guestTokenHash">,
  viewer: ThreadViewer
): boolean {
  if (viewer.kind === "admin") return true;
  if (viewer.kind === "broker") return thread.brokerUserId === viewer.userId;
  if (viewer.kind === "customer") return thread.customerUserId === viewer.userId;
  if (viewer.kind === "guest") {
    if (!thread.guestTokenHash || !viewer.guestToken.trim()) return false;
    return hashGuestToken(viewer.guestToken.trim()) === thread.guestTokenHash;
  }
  return false;
}

export function isPlatformAdmin(role: PlatformRole): boolean {
  return role === "ADMIN";
}
