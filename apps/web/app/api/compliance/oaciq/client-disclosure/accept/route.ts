import { NextRequest, NextResponse } from "next/server";
import type { OaciqClientDisclosureFlow } from "@prisma/client";
import { headers } from "next/headers";
import { getGuestId } from "@/lib/auth/session";
import {
  OACIQ_CLIENT_MANDATORY_DISCLOSURE_ACK_TEXT,
  recordOaciqClientDisclosureAccepted,
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
 * POST — record disclosure_accepted + DB row (checkbox + timestamp).
 */
export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    transactionId?: unknown;
    flow?: unknown;
    acknowledgeBrokerDisclosures?: unknown;
    ackText?: unknown;
  };

  const transactionId = typeof body.transactionId === "string" ? body.transactionId.trim() : "";
  const flow = parseFlow(body.flow);
  if (!transactionId || !flow) {
    return NextResponse.json({ error: "transactionId and valid flow are required" }, { status: 400 });
  }

  const fromCheckbox = body.acknowledgeBrokerDisclosures === true;
  const ackTextRaw = typeof body.ackText === "string" ? body.ackText : "";
  const ackText = fromCheckbox ? OACIQ_CLIENT_MANDATORY_DISCLOSURE_ACK_TEXT : ackTextRaw;

  if (ackText !== OACIQ_CLIENT_MANDATORY_DISCLOSURE_ACK_TEXT) {
    return NextResponse.json(
      {
        error: "Acknowledgment must use the exact mandatory text, or acknowledgeBrokerDisclosures: true.",
      },
      { status: 400 }
    );
  }

  const h = await headers();
  try {
    const r = await recordOaciqClientDisclosureAccepted({
      transactionId,
      userId,
      flow,
      ackText,
      clientIp: clientIp(h),
      userAgent: h.get("user-agent"),
    });
    return NextResponse.json({ ok: true, bundleVersion: r.bundleVersion });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
