import { NextResponse } from "next/server";
import { getListingAuditTrail } from "@/services/compliance/coownershipAudit.service";
import { canAccessAdminDashboard } from "@/lib/auth/role-guards";
import { getSession } from "@/lib/auth/get-session";

export async function GET(
  req: Request,
  { params }: { params: { listingId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listingId = params.listingId;
  try {
    const logs = await getListingAuditTrail(listingId);
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("[compliance_audit_api] error", error);
    return NextResponse.json({ error: "Failed to load audit logs" }, { status: 500 });
  }
}
