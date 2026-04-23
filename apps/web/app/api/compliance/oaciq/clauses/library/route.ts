import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { requireUser } from "@/lib/auth/require-user";
import { complianceFlags } from "@/config/feature-flags";
import { OACIQ_CLAUSE_LIBRARY } from "@/lib/compliance/oaciq/clause-compliance/library";

export const dynamic = "force-dynamic";

/** GET — read-only clause registry (broker/admin). */
export async function GET() {
  if (!complianceFlags.oaciqClauseComplianceEngineV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 404 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.user.role !== PlatformRole.BROKER && auth.user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    clauses: OACIQ_CLAUSE_LIBRARY.filter((c) => c.active).map((c) => ({
      id: c.id,
      category: c.category,
      labelFr: c.labelFr,
      labelEn: c.labelEn,
      requiredParams: c.requiredParams,
      optionalParams: c.optionalParams,
      complianceFlags: c.complianceFlags,
      version: c.version,
      templateFr: c.templateFr,
    })),
  });
}
