import { NextRequest } from "next/server";

import { getCloserAssist } from "@/modules/ai-closer/ai-closer.service";
import type { AiCloserRouteContext } from "@/modules/ai-closer/ai-closer.types";

export const dynamic = "force-dynamic";

/**
 * POST `/api/ai-closer/assist` — realtime assist for chat / calls / brokers.
 * No auth required for anonymized demos; attach `leadId` only when session allows CRM logging.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const route = (typeof body.route === "string" ? body.route : "unknown") as AiCloserRouteContext;
  const transcript = typeof body.transcript === "string" ? body.transcript : undefined;
  const messages = Array.isArray(body.messages) ? body.messages.filter((x: unknown) => typeof x === "string") : undefined;
  const listingHint = typeof body.listingHint === "string" ? body.listingHint : undefined;
  const leadId = typeof body.leadId === "string" ? body.leadId : undefined;
  const listingId = typeof body.listingId === "string" ? body.listingId : undefined;
  const persistStage = body.persistStage === false ? false : true;

  const out = await getCloserAssist({
    transcript,
    messages,
    route,
    listingHint,
    leadId,
    listingId,
    persistStage,
    visitIntent: Boolean(body.visitIntent),
    hotLead: Boolean(body.hotLead),
    optedOut: Boolean(body.optedOut),
    bookingAttempts: typeof body.bookingAttempts === "number" ? body.bookingAttempts : undefined,
    clickSignals: typeof body.clickSignals === "number" ? body.clickSignals : undefined,
    timelineUrgency:
      body.timelineUrgency === "high" || body.timelineUrgency === "medium" || body.timelineUrgency === "low"
        ? body.timelineUrgency
        : undefined,
    personalityHint: body.personalityHint,
  });

  return Response.json(out);
}
