import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompanyAiAdmin } from "@/modules/company-ai/company-ai-api-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCompanyAiAdmin();
  if (!auth.ok) return auth.response;

  const rows = await prisma.companyAdaptationEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ adaptations: rows });
}
