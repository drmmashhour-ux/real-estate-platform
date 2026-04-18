import { getFormDefinition } from "@/modules/oaciq-mapper/form-definition.registry";
import { requireBrokerOrAdminJson } from "@/lib/oaciq/broker-api-auth";
import { requireOaciqExactMapper } from "@/lib/oaciq/guard";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ formKey: string }> }) {
  const auth = await requireBrokerOrAdminJson();
  if (auth instanceof Response) return auth;
  const blocked = requireOaciqExactMapper();
  if (blocked) return blocked;

  const { formKey } = await context.params;
  const def = getFormDefinition(formKey);
  if (!def) return Response.json({ error: "Unknown form" }, { status: 404 });

  return Response.json({
    formKey: def.formKey,
    officialCode: def.officialCode,
    title: def.title,
    mandatoryOrRecommended: def.mandatoryOrRecommended,
    versionLabel: def.versionLabel,
    principalOrRelated: def.principalOrRelated,
    baseWorkflow: def.baseWorkflow,
    sectionCount: def.sections.length,
    fieldCount: def.sections.reduce((n, s) => n + s.fields.length, 0),
    draftNotice: "Specimen-oriented metadata — broker must use authorized forms for execution.",
  });
}
