import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { aiContractEngineFlags } from "@/config/feature-flags";
import { getFormByKey } from "@/modules/form-engine/form-registry.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ formKey: string }> }) {
  if (!aiContractEngineFlags.formRegistryV1 || !aiContractEngineFlags.aiContractEngineV1) {
    return Response.json({ error: "Form registry disabled" }, { status: 403 });
  }
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return Response.json({ error: "Broker access only" }, { status: 403 });
  }

  const { formKey } = await context.params;
  const form = getFormByKey(decodeURIComponent(formKey));
  if (!form) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ form, draftNotice: "Draft assistance — broker review required." });
}
