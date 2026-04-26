import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { appendLegalFormAudit } from "@/lib/forms/audit";
import { ensureDefaultLegalFormTemplates } from "@/lib/forms/ensure-default-templates";
import { requireBrokerLikeApi } from "@/lib/forms/require-broker";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const drafts = await prisma.legalFormDraft.findMany({
    where: { brokerUserId: auth.userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { template: { select: { key: true, name: true, language: true } } },
  });
  return Response.json({ drafts });
}

export async function POST(req: Request) {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const templateKey = typeof body.templateKey === "string" ? body.templateKey : null;
  const listingId = typeof body.listingId === "string" ? body.listingId : null;
  const clientUserId = typeof body.clientUserId === "string" ? body.clientUserId : null;
  const language = typeof body.language === "string" ? body.language : "fr";

  if (!templateKey) {
    return Response.json({ error: "templateKey required" }, { status: 400 });
  }

  await ensureDefaultLegalFormTemplates();
  const template = await prisma.legalFormTemplate.findUnique({ where: { key: templateKey } });
  if (!template) {
    return Response.json({ error: "Template not found" }, { status: 404 });
  }

  const draft = await prisma.legalFormDraft.create({
    data: {
      templateId: template.id,
      listingId,
      brokerUserId: auth.userId,
      clientUserId,
      language,
      status: "draft",
      fieldValuesJson: {},
      alertsJson: {},
    },
  });

  await appendLegalFormAudit({
    draftId: draft.id,
    actorUserId: auth.userId,
    eventType: "created",
    metadata: { templateKey },
  });

  return Response.json({ draft });
}
