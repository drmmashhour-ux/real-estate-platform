import { listFormDefinitions } from "@/modules/oaciq-mapper/form-definition.registry";
import { requireBrokerOrAdminJson } from "@/lib/oaciq/broker-api-auth";
import { requireOaciqExactMapper } from "@/lib/oaciq/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireBrokerOrAdminJson();
  if (auth instanceof Response) return auth;
  const blocked = requireOaciqExactMapper();
  if (blocked) return blocked;

  const forms = listFormDefinitions().map((f) => ({
    formKey: f.formKey,
    officialCode: f.officialCode,
    title: f.title,
    mandatoryOrRecommended: f.mandatoryOrRecommended,
    versionLabel: f.versionLabel,
    principalOrRelated: f.principalOrRelated,
  }));
  return Response.json({ forms, draftNotice: "Specimen-oriented definitions — not operative legal forms." });
}
