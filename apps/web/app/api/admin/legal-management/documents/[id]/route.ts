import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { canAccessLegalManagement } from "@/lib/legal-management/admin-auth";
import { isCorporateLegalStatus } from "@/lib/legal-management/constants";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessLegalManagement(uid))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as { status?: string };
  const status = typeof b.status === "string" ? b.status.trim() : "";
  if (!isCorporateLegalStatus(status)) {
    return Response.json({ error: "invalid status" }, { status: 400 });
  }

  try {
    const row = await prisma.corporateLegalDocument.update({
      where: { id },
      data: { status },
    });
    return Response.json({
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    });
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}
