import { z } from "zod";

import { getGuestId } from "@/lib/auth/session";
import { trackAcquisition } from "@/lib/growth/acquisition";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  source: z.string().trim().min(1).max(256),
});

/**
 * POST — record one acquisition touch (TikTok, referral, UTM, etc.) for the signed-in user.
 * Body: `{ "source": "tiktok" }`. `userId` is taken from the session (not the request body) to avoid spoofing.
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  await trackAcquisition(parsed.data.source, userId);
  return Response.json({ ok: true });
}
