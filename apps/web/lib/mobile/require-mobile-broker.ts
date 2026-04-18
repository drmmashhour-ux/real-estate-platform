import type { NextRequest } from "next/server";
import { brokerMobileFlags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { requireMobileGuestUser } from "@/lib/bnhub/mobile-api";

export type MobileBrokerUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
};

export type MobileBrokerAuth =
  | { ok: true; user: MobileBrokerUser; isAdmin: boolean }
  | { ok: false; response: Response };

/**
 * Residential broker mobile APIs — session cookie / Bearer (same as BNHub mobile).
 * ADMIN may impersonate test paths only when explicitly allowed per route.
 */
export async function requireMobileBrokerUser(request: Request | NextRequest): Promise<MobileBrokerAuth> {
  if (!brokerMobileFlags.brokerMobileWorkflowV1) {
    return {
      ok: false,
      response: Response.json({ error: "Broker mobile workflow disabled" }, { status: 403 }),
    };
  }

  const guest = await requireMobileGuestUser(request);
  if (!guest) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const full = await prisma.user.findUnique({
    where: { id: guest.id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!full) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (full.role !== "BROKER" && full.role !== "ADMIN") {
    return { ok: false, response: Response.json({ error: "Broker role required" }, { status: 403 }) };
  }

  return { ok: true, user: full, isAdmin: full.role === "ADMIN" };
}

export function requireDailyActionCenterEnabled(): Response | null {
  if (!brokerMobileFlags.dailyActionCenterV1) {
    return Response.json({ error: "Daily action center disabled" }, { status: 403 });
  }
  return null;
}

export function requireBrokerPushEnabled(): Response | null {
  if (!brokerMobileFlags.brokerPushNotificationsV1) {
    return Response.json({ error: "Broker push notifications disabled" }, { status: 403 });
  }
  return null;
}

export function requireMobileQuickApprovalsEnabled(): Response | null {
  if (!brokerMobileFlags.mobileQuickApprovalsV1) {
    return Response.json({ error: "Mobile quick approvals disabled" }, { status: 403 });
  }
  return null;
}
