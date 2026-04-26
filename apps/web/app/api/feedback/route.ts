import { z } from "zod";

import { getGuestId } from "@/lib/auth/session";
import { submitFeedback } from "@/lib/feedback/system";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(8000),
});

/**
 * POST — submit product feedback. `userId` is taken from the session (not the body).
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

  await submitFeedback(userId, parsed.data.message);
  return Response.json({ ok: true });
}
