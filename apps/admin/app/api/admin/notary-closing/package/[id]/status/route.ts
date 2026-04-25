import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { updatePackageStatus } from "@/lib/notary-closing";
import { PACKAGE_STATUSES } from "@/lib/notary-closing/types";

/**
 * POST /api/admin/notary-closing/package/:id/status (id = packageId)
 * Body: { packageStatus: "draft" | "ready" | "notary_review" | "closing_scheduled" | "completed" }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { id: packageId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const packageStatus = body.packageStatus;
    if (!packageStatus || !PACKAGE_STATUSES.includes(packageStatus)) {
      return Response.json({ error: "packageStatus must be one of: " + PACKAGE_STATUSES.join(", ") }, { status: 400 });
    }

    const pkg = await updatePackageStatus(packageId, packageStatus);
    return Response.json(pkg);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update status";
    return Response.json({ error: message }, { status: 400 });
  }
}
