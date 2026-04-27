import { z } from "zod";

import { emptyConversionScore, getConversionNudge, getConversionScore } from "@/lib/ai/conversionEngine";
import { flags } from "@/lib/flags";
import { getGuestId } from "@/lib/auth/session";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";
import { logError } from "@/lib/monitoring/errorLogger";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  listingId: z.string().min(1).max(64),
  userId: z.string().min(1).max(64).optional(),
  city: z.string().max(200).optional(),
});

/**
 * POST /api/ai/conversion-score — server-side score + nudge; userId must match session when signed in.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!flags.RECOMMENDATIONS) {
    return Response.json(
      { score: null, nudge: null, disabled: true as const },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const sessionUserId = await getGuestId();
  const { listingId, city } = parsed.data;
  let userId = parsed.data.userId;
  if (userId && sessionUserId && userId !== sessionUserId) {
    return Response.json({ error: "userId does not match session" }, { status: 403 });
  }
  if (!userId && sessionUserId) {
    userId = sessionUserId;
  }
  if (!userId) {
    const s = emptyConversionScore(listingId, undefined);
    return Response.json(
      { score: s, nudge: getConversionNudge(s), disabled: false as const, anonymous: true as const },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const score = await getConversionScore({ listingId, userId, city });
    const nudge = getConversionNudge(score);
    return Response.json(
      { score, nudge, disabled: false as const, anonymous: false as const },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    logError(e, { route: "/api/ai/conversion-score" });
    return Response.json({ error: "Failed to score" }, { status: 500 });
  }
}
