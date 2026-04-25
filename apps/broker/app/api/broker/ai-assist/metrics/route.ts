import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { brokerAiAssistFlags, brokerClosingFlags } from "@/config/feature-flags";
import { logInfo } from "@/lib/logger";

const LOG = "[broker:ai-assist]";

export const dynamic = "force-dynamic";

/** Best-effort client telemetry — never blocks */
export async function POST(req: Request) {
  if (!brokerAiAssistFlags.brokerAiAssistV1 || !brokerClosingFlags.brokerClosingV1) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let body: { event?: unknown; leadId?: unknown };
  try {
    body = (await req.json()) as { event?: unknown; leadId?: unknown };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    if (body.event === "assist_draft_opened") {
      logInfo(`${LOG} client_draft_opened`, { leadId: typeof body.leadId === "string" ? body.leadId : undefined });
    }
    if (body.event === "assist_guidance_used") {
      logInfo(`${LOG} client_guidance_used`, { leadId: typeof body.leadId === "string" ? body.leadId : undefined });
    }
  } catch {
    /* noop */
  }

  return NextResponse.json({ ok: true });
}
