import { getFormDefinition } from "@/modules/oaciq-mapper/form-definition.registry";
import { requireBrokerOrAdminJson } from "@/lib/oaciq/broker-api-auth";
import { requireOaciqFormMapper } from "@/lib/oaciq/guard";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ formKey: string }> }) {
  const auth = await requireBrokerOrAdminJson();
  if (auth instanceof Response) return auth;
  const { formKey } = await context.params;
  const blocked = requireOaciqFormMapper(formKey);
  if (blocked) return blocked;

  const def = getFormDefinition(formKey);
  if (!def) return Response.json({ error: "Unknown form" }, { status: 404 });

  return Response.json({
    definition: def,
    attribution: {
      source: "LECIPM specimen field registry v1",
      specimenDisclaimer: "Structure mirrors workflow order for mapping — not a reproduction of proprietary publisher text.",
    },
  });
}
