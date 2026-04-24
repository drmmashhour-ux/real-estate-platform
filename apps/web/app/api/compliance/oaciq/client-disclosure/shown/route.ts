import { NextRequest, NextResponse } from "next/server";
import type { OaciqClientDisclosureFlow } from "@prisma/client";
import { headers } from "next/headers";
import { getGuestId } from "@/lib/auth/session";
import {
  assertTransactionParty,
  logOaciqDisclosureShown,
  oaciqClientDisclosureEnforcementEnabled,
} from "@/lib/compliance/oaciq/client-disclosure";

export const dynamic = "force-dynamic";

const FLOWS = new Set<string>(["OFFER_SUBMIT", "CONTRACT_SIGN", "AGREEMENT"]);

function parseFlow(s: unknown): OaciqClientDisclosureFlow | null {
  if (typeof s !== "string" || !FLOWS.has(s)) return null;
  return s as OaciqClientDisclosureFlow;
}

function clientIp(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || null;
}

/**
 * POST — log disclosure_shown (compliance:oaciq).
 */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    transactionId?: unknown;
    flow?: unknown;
  };
  const transactionId = typeof body.transactionId === "string" ? body.transactionId.trim() : "";
  const flow = parseFlow(body.flow);
  if (!transactionId || !flow) {
    return NextResponse.json({ error: "transactionId and valid flow are required" }, { status: 400 });
  }

  try {
    await assertTransactionParty(transactionId, userId);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Forbidden" }, { status: 403 });
  }

  const h = await headers();
  logOaciqDisclosureShown({
    transactionId,
    userId,
    flow,
    enforcementEnabled: oaciqClientDisclosureEnforcementEnabled(),
    clientIp: clientIp(h),
    userAgent: h.get("user-agent") ?? undefined,
    outcomeHint: {
      capture: true,
      entityType: "compliance" as const,
      entityId: transactionId,
      actionTaken: "disclosure_shown",
      predictedOutcome: { expectView: true },
      actualOutcome: { viewed: true, flow },
      source: "log_hook" as const,
      contextUserId: userId,
    },
  });

  return NextResponse.json({ ok: true });
}
