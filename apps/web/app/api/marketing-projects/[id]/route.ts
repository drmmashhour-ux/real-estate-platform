import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { engineFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { marketingProjectUpdateBodySchema } from "@/modules/marketing-studio/marketing-projects-api.schema";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function marketingStudioDisabled() {
  if (!engineFlags.marketingStudioV1) {
    return jsonError("Marketing Studio is disabled", 403);
  }
  return null;
}

async function loadOwned(id: string, userId: string) {
  return prisma.marketingStudioProject.findFirst({
    where: { id, userId },
  });
}

/** GET /api/marketing-projects/[id] — load one design */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const disabled = marketingStudioDisabled();
  if (disabled) return disabled;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  if (!id?.trim()) return jsonError("Not found", 404);

  const row = await loadOwned(id.trim(), auth.userId);
  if (!row) return jsonError("Not found", 404);

  return NextResponse.json({
    id: row.id,
    title: row.title,
    projectData: row.projectData,
    updatedAt: row.updatedAt.toISOString(),
  });
}

/** PUT /api/marketing-projects/[id] — update */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const disabled = marketingStudioDisabled();
  if (disabled) return disabled;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  if (!id?.trim()) return jsonError("Not found", 404);

  const existing = await loadOwned(id.trim(), auth.userId);
  if (!existing) return jsonError("Not found", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = marketingProjectUpdateBodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ") || "Invalid body";
    return jsonError(msg, 400);
  }

  const data: { title?: string; projectData?: object } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.projectData !== undefined) data.projectData = parsed.data.projectData;

  try {
    await prisma.marketingStudioProject.update({
      where: { id: existing.id },
      data,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[marketing-projects PUT]", e);
    return jsonError("Could not update project", 500);
  }
}

/** DELETE /api/marketing-projects/[id] */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const disabled = marketingStudioDisabled();
  if (disabled) return disabled;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  if (!id?.trim()) return jsonError("Not found", 404);

  const existing = await loadOwned(id.trim(), auth.userId);
  if (!existing) return jsonError("Not found", 404);

  try {
    await prisma.marketingStudioProject.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[marketing-projects DELETE]", e);
    return jsonError("Could not delete project", 500);
  }
}
