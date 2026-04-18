import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { platformImprovementFlags } from "@/config/feature-flags";
import { buildFullPlatformImprovementBundle } from "@/modules/platform/platform-improvement-review.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!platformImprovementFlags.platformImprovementReviewV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!(await requireAdminUser(viewerId))) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const bundle = buildFullPlatformImprovementBundle();
  return NextResponse.json(bundle);
}
