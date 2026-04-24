import { PlatformRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getInvestorByEmail } from "@/modules/investor/auth/investor-auth";
import {
  buildAnalysisOnlyInvestorDashboard,
  buildBnhubInvestorDashboard,
} from "@/modules/investor/investor-dashboard-performance.service";

export const dynamic = "force-dynamic";

/**
 * Full investor dashboard payload: overview, deals, performance split, report rollups, documents.
 * INVESTOR role required. Uses BNHub `InvestorAccess` when active; otherwise saved analyses only.
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (auth.user.role !== PlatformRole.INVESTOR) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const access = await getInvestorByEmail(auth.user.email);
  const payload =
    access?.isActive === true
      ? await buildBnhubInvestorDashboard(auth.user.id, access)
      : await buildAnalysisOnlyInvestorDashboard(auth.user.id);

  return NextResponse.json(payload);
}
