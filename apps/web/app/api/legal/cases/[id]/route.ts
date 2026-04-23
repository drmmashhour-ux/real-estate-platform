import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import {
  extractCorpusMetaFromLinkedRuleIdsJson,
  extractRuleIdsFromLinkedRuleIdsJson,
} from "@/modules/legal/linked-rules-json";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const c = await prisma.legalCase.findUnique({ where: { id } });
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let linkedRules: Awaited<ReturnType<typeof prisma.legalRule.findMany>> = [];
    const raw = c.linkedRuleIds;
    const ruleIds = extractRuleIdsFromLinkedRuleIdsJson(raw);
    if (ruleIds.length > 0) {
      linkedRules = await prisma.legalRule.findMany({
        where: { id: { in: ruleIds }, enabled: true },
      });
    }

    const corpusMeta = extractCorpusMetaFromLinkedRuleIdsJson(raw);

    return NextResponse.json({ case: c, linkedRules, corpusMeta });
  } catch (e) {
    console.error("GET /api/legal/cases/[id]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
