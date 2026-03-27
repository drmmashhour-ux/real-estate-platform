import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await getGuestId();
  if (!userId) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== "ADMIN") {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if ("error" in gate && gate.error) return gate.error;
  const { id } = await params;
  const row = await prisma.contractDraftTemplate.findUnique({ where: { id } });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if ("error" in gate && gate.error) return gate.error;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.slug === "string") data.slug = body.slug.trim();
  if (typeof body.contractType === "string") data.contractType = body.contractType.trim();
  if (body.definition && typeof body.definition === "object") data.definition = body.definition;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const row = await prisma.contractDraftTemplate.update({
    where: { id },
    data,
  });
  return Response.json(row);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if ("error" in gate && gate.error) return gate.error;
  const { id } = await params;
  await prisma.contractDraftTemplate.delete({ where: { id } });
  return Response.json({ ok: true });
}
