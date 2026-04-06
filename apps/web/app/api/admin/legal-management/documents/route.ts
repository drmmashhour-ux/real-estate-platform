import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { canAccessLegalManagement } from "@/lib/legal-management/admin-auth";
import {
  isCorporateLegalDocType,
  isCorporateLegalStatus,
} from "@/lib/legal-management/constants";

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
  const b = body as { name?: string; type?: string; status?: string };
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const type = typeof b.type === "string" ? b.type.trim() : "";
  const status = typeof b.status === "string" ? b.status.trim() : "draft";

  if (!name) return Response.json({ error: "name required" }, { status: 400 });
  if (!isCorporateLegalDocType(type)) {
    return Response.json({ error: "invalid type" }, { status: 400 });
  }
  if (!isCorporateLegalStatus(status)) {
    return Response.json({ error: "invalid status" }, { status: 400 });
  }

  const row = await prisma.corporateLegalDocument.create({
    data: { name, type, status },
  });
  return Response.json({
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  });
}
