import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { buildKnowledgeIndex } from "@/modules/ai-training/application/buildKnowledgeIndex";
import { retrieveKnowledge } from "@/modules/ai-training/application/retrieveKnowledge";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  const listingId = typeof body?.listingId === "string" ? body.listingId : undefined;
  const city = typeof body?.city === "string" ? body.city : undefined;
  const propertyType = typeof body?.propertyType === "string" ? body.propertyType : undefined;
  const workspaceId = typeof body?.workspaceId === "string" ? body.workspaceId : undefined;
  const memoryTypes = Array.isArray(body?.memoryTypes) ? body.memoryTypes.filter((x: unknown) => typeof x === "string") : undefined;

  await buildKnowledgeIndex(prisma, { userId, workspaceId }).catch(() => {});
  const items = await retrieveKnowledge(prisma, {
    userId,
    workspaceId,
    listingId,
    city,
    propertyType,
    memoryTypes,
    query,
    limit: 20,
  });
  return NextResponse.json({ items });
}
