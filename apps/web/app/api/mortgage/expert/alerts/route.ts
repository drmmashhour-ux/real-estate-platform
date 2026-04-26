import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";

export const dynamic = "force-dynamic";

/** New mortgage leads (pipeline new) for dashboard banner */
export async function GET() {
  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;
  const { expert } = session;

  const newLeadCount = await prisma.lead.count({
    where: {
      assignedExpertId: expert.id,
      leadType: "mortgage",
      pipelineStatus: "new",
    },
  });

  return NextResponse.json({ newLeadCount });
}
