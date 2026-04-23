import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { aiContractEngineFlags } from "@/config/feature-flags";
import { listRegisteredForms } from "@/modules/form-engine/form-registry.service";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!aiContractEngineFlags.formRegistryV1 || !aiContractEngineFlags.aiContractEngineV1) {
    return Response.json({ error: "Form registry disabled" }, { status: 403 });
  }
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return Response.json({ error: "Broker access only" }, { status: 403 });
  }

  const forms = listRegisteredForms();
  return Response.json({
    forms,
    draftNotice: "Draft assistance — broker review required.",
    disclaimer: "Registry describes specimen-oriented structure — not operative execution forms.",
  });
}
