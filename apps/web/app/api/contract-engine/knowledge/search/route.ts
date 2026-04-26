import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { aiContractEngineFlags } from "@/config/feature-flags";
import { retrieveHybrid } from "@/modules/legal-knowledge/legal-retrieval.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!aiContractEngineFlags.aiContractEngineV1 || !aiContractEngineFlags.clauseRetrievalV1) {
    return Response.json({ error: "Clause retrieval disabled" }, { status: 403 });
  }
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return Response.json({ error: "Broker access only" }, { status: 403 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return Response.json({ error: "Query too short" }, { status: 400 });

  const hits = await retrieveHybrid(q, { limit: 12 });
  return Response.json({
    hits,
    disclaimer: "Retrieved excerpts are for broker review — verify against source materials.",
  });
}
