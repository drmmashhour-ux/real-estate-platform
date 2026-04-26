import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getCrmEliteDashboard } from "@/modules/crm/application/getCrmEliteDashboard";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";

export const dynamic = "force-dynamic";

/** GET /api/crm/dashboard — top leads, best deals, risk, pipeline counts. */
export async function GET() {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;

  const dash = await getCrmEliteDashboard(prisma, gate.session.id, {
    adminView: gate.session.role === "ADMIN",
  });

  return NextResponse.json(dash);
}
