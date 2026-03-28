import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { normDim } from "@/src/modules/messaging/learning/contextKey";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type Body = {
  stage?: string;
  detectedIntent?: string;
  detectedObjection?: string;
  highIntent?: boolean;
  overrideTemplateKey?: string;
  note?: string;
};

/** POST — upsert an admin manual routing override (does not enable global self-learning). */
export async function POST(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (admin?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const templateKey = body.overrideTemplateKey?.trim();
  if (!templateKey) {
    return Response.json({ error: "overrideTemplateKey required" }, { status: 400 });
  }

  const stage = normDim(body.stage);
  const detectedIntent = normDim(body.detectedIntent);
  const detectedObjection = normDim(body.detectedObjection);
  const highIntent = Boolean(body.highIntent);

  const row = await prisma.growthAiLearningManualOverride.upsert({
    where: {
      stage_detectedIntent_detectedObjection_highIntent: {
        stage,
        detectedIntent,
        detectedObjection,
        highIntent,
      },
    },
    create: {
      stage,
      detectedIntent,
      detectedObjection,
      highIntent,
      overrideTemplateKey: templateKey,
      note: body.note ?? null,
      isActive: true,
    },
    update: {
      overrideTemplateKey: templateKey,
      note: body.note ?? null,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  return Response.json({ ok: true, override: row });
}
