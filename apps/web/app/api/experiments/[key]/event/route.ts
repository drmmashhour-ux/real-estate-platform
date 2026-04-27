import { trackExperimentEvent } from "@/lib/experiments/engine";
import { getGuestId } from "@/lib/auth/session";
import { flags } from "@/lib/flags";

export const dynamic = "force-dynamic";

/**
 * Body: `{ "event": "hero_view" | "cta_click" | "signup_completed" | ... }`
 * No-ops when `RECOMMENDATIONS` is off or the user is not in the experiment.
 */
export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }
  if (!flags.RECOMMENDATIONS) {
    return Response.json({ ok: false, recommendationsOff: true });
  }
  let event = "";
  try {
    const b = (await req.json()) as { event?: string };
    event = typeof b.event === "string" ? b.event : "";
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!event) {
    return Response.json({ error: "event required" }, { status: 400 });
  }

  await trackExperimentEvent(userId, decodeURIComponent(key), event);
  return Response.json({ ok: true });
}
