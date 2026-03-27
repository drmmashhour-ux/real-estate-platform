import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { seedContractDraftTemplatesIfEmpty } from "@/lib/contracts/seed-contract-draft-templates";

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

/** GET — list templates (seed defaults if empty). */
export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate && gate.error) return gate.error;

  await seedContractDraftTemplatesIfEmpty().catch(() => {});

  const rows = await prisma.contractDraftTemplate.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return Response.json(rows);
}

/** POST — create template. */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate && gate.error) return gate.error;

  const body = await request.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const contractType = typeof body.contractType === "string" ? body.contractType.trim() : "";
  const definition = body.definition;
  if (!slug || !name || !contractType || !definition || typeof definition !== "object") {
    return Response.json({ error: "slug, name, contractType, definition required" }, { status: 400 });
  }

  const row = await prisma.contractDraftTemplate.create({
    data: {
      slug,
      name,
      contractType,
      definition: definition as object,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      isActive: body.isActive !== false,
    },
  });
  return Response.json(row);
}
