import { PlatformRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { indexLegalMaterial } from "@/modules/legal-knowledge/legal-source-indexer";
import type { LegalIngestPayload } from "@/modules/legal-knowledge/legal-knowledge.types";

export const dynamic = "force-dynamic";

/** Internal/admin: re-run chunk indexing from structured payload (no public access). */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Admin only" }, { status: 403 });
  }

  let body: LegalIngestPayload;
  try {
    body = (await request.json()) as LegalIngestPayload;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.sourceName || !body.fileUrl || !body.sections?.length) {
    return Response.json({ error: "sourceName, fileUrl, sections required" }, { status: 400 });
  }

  const result = await indexLegalMaterial(body);
  return Response.json({ ok: true, ...result });
}
