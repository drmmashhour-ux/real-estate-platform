import { getGuestId } from "@/lib/auth/session";
import { startFsboListingPublishCheckout } from "@/lib/fsbo/publish-checkout";
import { parseFsboPublishPlan } from "@/lib/fsbo/constants";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";

export const dynamic = "force-dynamic";

/**
 * POST — Stripe Checkout to publish a draft FSBO (or free publish when dev flag + no Stripe).
 * Body (optional JSON): { "plan": "basic" | "premium" }
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const licenseBlock = await requireContentLicenseAccepted(userId);
  if (licenseBlock) return licenseBlock;

  let plan: unknown = undefined;
  try {
    const raw = await request.text();
    if (raw.trim()) {
      const j = JSON.parse(raw) as Record<string, unknown>;
      plan = j.plan;
    }
  } catch {
    plan = undefined;
  }

  const result = await startFsboListingPublishCheckout(userId, id, plan ?? parseFsboPublishPlan("basic"));

  if (!result.ok) {
    return Response.json(
      {
        error: result.error,
        ...(result.trustGraph ? { trustGraph: result.trustGraph } : {}),
      },
      { status: result.status }
    );
  }
  if ("freePublish" in result && result.freePublish) {
    return Response.json({ ok: true, freePublish: true });
  }
  if ("url" in result) {
    return Response.json({ url: result.url });
  }
  return Response.json({ error: "Unexpected checkout response" }, { status: 500 });
}
