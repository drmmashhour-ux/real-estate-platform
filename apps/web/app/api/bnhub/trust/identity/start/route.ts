/**
 * POST { returnUrl } — start Stripe Identity for signed-in host (or guest if extended).
 */

import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { startIdentityVerification } from "@/modules/bnhub-trust/services/identityVerificationService";
import { BnhubTrustIdentityUserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const hasListing = await prisma.shortTermListing.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (!hasListing) {
    return Response.json({ error: "Host listings required for this flow" }, { status: 403 });
  }
  let returnUrl = "";
  try {
    const b = await req.json();
    returnUrl = typeof b.returnUrl === "string" ? b.returnUrl.trim() : "";
  } catch {
    /* empty */
  }
  if (!returnUrl) return Response.json({ error: "returnUrl required" }, { status: 400 });
  const res = await startIdentityVerification({
    userId,
    userRole: BnhubTrustIdentityUserRole.HOST,
    returnUrl,
  });
  if ("error" in res) return Response.json({ error: res.error }, { status: 400 });
  return Response.json({
    id: res.id,
    sessionId: res.sessionId,
    clientSecret: res.clientSecret,
    url: res.url,
  });
}
