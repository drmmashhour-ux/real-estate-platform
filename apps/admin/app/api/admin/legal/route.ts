import { NextResponse } from "next/server";
import { legalHubFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { buildLegalAdminReviewQueue } from "@/modules/legal/legal-admin-review.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getGuestId().catch(() => null);
    const admin = await requireAdminUser(userId);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!legalHubFlags.legalHubAdminReviewV1) {
      return NextResponse.json({
        queue: [],
        risks: [],
        counts: {},
        freshness: null,
        flags: legalHubFlags,
        missingDataWarnings: [],
        disabled: true,
      });
    }

    const queue = await buildLegalAdminReviewQueue();

    const counts = {
      pendingVerificationListings: queue.items.find((i) => i.label.includes("awaiting verification"))?.count ?? 0,
      moderationRejectedListings: queue.items.find((i) => i.label.includes("rejected"))?.count ?? 0,
      brokerLicensePending: queue.items.find((i) => i.label.includes("Broker licenses"))?.count ?? 0,
    };

    return NextResponse.json({
      queue: queue.items,
      risks: [],
      counts,
      freshness: queue.generatedAt,
      flags: legalHubFlags,
      missingDataWarnings: queue.missingDataWarnings,
      disabled: false,
    });
  } catch {
    return NextResponse.json({
      queue: [],
      risks: [],
      counts: {},
      freshness: null,
      flags: legalHubFlags,
      missingDataWarnings: [],
      disabled: true,
    });
  }
}
