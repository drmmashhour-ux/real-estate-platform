import type { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { ThreadViewer } from "@/lib/messages/permissions";
import { isPlatformAdmin } from "@/lib/messages/permissions";

export function getRequestIp(request: NextRequest): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function resolveThreadViewerFromRequest(
  request: NextRequest,
  guestToken: string | null
): Promise<
  | { viewer: ThreadViewer; userRole?: import("@prisma/client").PlatformRole }
  | { viewer: null; error: string; status: number }
> {
  const userId = await getGuestId();
  if (guestToken?.trim()) {
    return { viewer: { kind: "guest", guestToken: guestToken.trim() } };
  }
  if (!userId) {
    return { viewer: null, error: "Sign in required", status: 401 };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return { viewer: null, error: "User not found", status: 401 };

  if (isPlatformAdmin(user.role)) {
    return { viewer: { kind: "admin", userId: user.id }, userRole: user.role };
  }
  if (user.role === "BROKER") {
    return { viewer: { kind: "broker", userId: user.id }, userRole: user.role };
  }
  return { viewer: { kind: "customer", userId: user.id }, userRole: user.role };
}
