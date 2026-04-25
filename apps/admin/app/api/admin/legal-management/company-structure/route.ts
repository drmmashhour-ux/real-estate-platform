import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { canAccessLegalManagement } from "@/lib/legal-management/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessLegalManagement(uid))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as { entityType?: string; jurisdiction?: string };
  const entityType = typeof b.entityType === "string" ? b.entityType.trim() : "";
  const jurisdiction = typeof b.jurisdiction === "string" ? b.jurisdiction.trim() : "";

  if (!entityType) return Response.json({ error: "entityType required" }, { status: 400 });
  if (!jurisdiction) return Response.json({ error: "jurisdiction required" }, { status: 400 });

  const row = await prisma.companyStructure.create({
    data: { entityType, jurisdiction },
  });
  return Response.json({
    id: row.id,
    entityType: row.entityType,
    jurisdiction: row.jurisdiction,
    createdAt: row.createdAt.toISOString(),
  });
}
