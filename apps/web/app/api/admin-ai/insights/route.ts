import { NextRequest } from "next/server";
import { getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
import { flags } from "@/lib/flags";
const prisma = getLegacyDB();
import { AdminAiInsightType } from "@prisma/client";

export const dynamic = "force-dynamic";

const INSIGHT_TYPES = new Set<string>(Object.values(AdminAiInsightType));

export async function GET(request: NextRequest) {
  if (!flags.AI_ASSISTANT) {
    return Response.json({ error: "AI assistant disabled", disabled: true }, { status: 403 });
  }
  const role = await getUserRole();
  if (!isHubAdminRole(role)) {
    return Response.json({ error: "Admin required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(120, Math.max(1, Number(searchParams.get("limit") || "60")));
  const typeRaw = searchParams.get("type");
  const type =
    typeRaw && INSIGHT_TYPES.has(typeRaw) ? (typeRaw as AdminAiInsightType) : undefined;

  const where = type ? { type } : {};

  const rows = await prisma.adminAiInsight.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return Response.json({ insights: rows });
}
