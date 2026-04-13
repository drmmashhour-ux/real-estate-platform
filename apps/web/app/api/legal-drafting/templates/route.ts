import { requireBrokerLikeApi } from "@/lib/forms/require-broker";
import { ensureDefaultLegalFormTemplates } from "@/lib/forms/ensure-default-templates";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  await ensureDefaultLegalFormTemplates();
  const templates = await prisma.legalFormTemplate.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return Response.json({ templates });
}
