import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";

export const dynamic = "force-dynamic";

const PERSONAS = new Set(["find", "list", "invest"]);

export async function POST(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { persona?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const persona = typeof body.persona === "string" ? body.persona.trim().toLowerCase() : "";
  if (!PERSONAS.has(persona)) {
    return Response.json({ error: "persona must be find, list, or invest" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      launchOnboardingCompletedAt: new Date(),
      launchPersonaChoice: persona,
    },
  });

  await persistLaunchEvent("ONBOARDING_COMPLETE", { persona, userId });

  return Response.json({ ok: true });
}
