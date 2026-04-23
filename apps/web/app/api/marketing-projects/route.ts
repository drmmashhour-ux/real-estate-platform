import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { engineFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { marketingProjectCreateBodySchema } from "@/modules/marketing-studio/marketing-projects-api.schema";

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

/** GET /api/marketing-projects — list current user's designs */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const rows = await prisma.marketingStudioProject.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({
    projects: rows.map((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

/** POST /api/marketing-projects — create design */
export async function POST(req: Request) {
  const disabled = marketingStudioDisabled();
  if (disabled) return disabled;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = marketingProjectCreateBodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ") || "Invalid body";
    return jsonError(msg, 400);
  }

  const title = parsed.data.title ?? "Untitled design";

  try {
    const row = await prisma.marketingStudioProject.create({
      data: {
        userId: auth.userId,
        title,
        projectData: parsed.data.projectData,
      },
      select: { id: true },
    });
    return NextResponse.json({ id: row.id });
  } catch (e) {
    console.error("[marketing-projects POST]", e);
    return jsonError("Could not save project", 500);
  }
}
