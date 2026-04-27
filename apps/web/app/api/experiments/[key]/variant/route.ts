import { getExperimentVariant } from "@/lib/experiments/engine";
import { getGuestId } from "@/lib/auth/session";
import { flags } from "@/lib/flags";

export const dynamic = "force-dynamic";

/**
 * Returns assigned variant for the signed-in user, or `null` when the experiment is off, not running, or unauthenticated.
 * Requires `FEATURE_RECO=1` (`flags.RECOMMENDATIONS`).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const userId = await getGuestId();

  if (!flags.RECOMMENDATIONS) {
    return Response.json({ variant: null, recommendationsOff: true }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const variant = await getExperimentVariant(userId, decodeURIComponent(key));
  return Response.json(
    { variant, recommendationsOff: false },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
