import { complianceAdminFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getDealReviewSurfaceForViewer } from "@/modules/qa-review/review-surface.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!complianceAdminFlags.brokerageQaReviewV1 && !complianceAdminFlags.adminComplianceCommandCenterV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const { id: dealId } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const surface = await getDealReviewSurfaceForViewer({
    dealId,
    viewerUserId: userId,
    viewerRole: user.role,
  });
  return Response.json({ surface });
}
