import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getIpSecurityGovernanceSnapshot } from "@/services/governance/ip-security-governance.service";
import { computeGovernanceRisk } from "@/services/governance/ip-security-risk.service";
import { buildGovernanceAlerts } from "@/services/governance/governance-alert.service";

export const dynamic = "force-dynamic";

/** Read-only governance snapshot for admin review (not compliance certification). */
export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const snapshot = getIpSecurityGovernanceSnapshot();
  const risk = computeGovernanceRisk(snapshot);
  const alerts = buildGovernanceAlerts(snapshot);

  return NextResponse.json({
    snapshot,
    risk,
    alerts,
  });
}
