import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { lecipmOaciqFlags } from "@/config/feature-flags";
import { listFormDefinitions } from "@/modules/oaciq-mapper/form-definition.registry";

export const dynamic = "force-dynamic";

/** GET /api/forms/templates — registry specimen definitions + persisted uploaded templates (when engine flag on). */
export async function GET() {
  if (!lecipmOaciqFlags.oaciqFormsEngineV1) {
    return Response.json({ error: "OACIQ forms engine disabled" }, { status: 403 });
  }

  const registry = listFormDefinitions().map((f) => ({
    source: "registry" as const,
    formKey: f.formKey,
    title: f.title,
    officialCode: f.officialCode,
    versionLabel: f.versionLabel,
  }));

  const uploaded = await prisma.oaciqFormTemplate.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      formFamily: true,
      versionLabel: true,
      extractedFieldCount: true,
      createdAt: true,
    },
  });

  return Response.json({
    registry,
    uploadedTemplates: uploaded,
    notice: "Registry entries are specimen-oriented. Uploaded rows derive field lists from PDF AcroForm extraction.",
  });
}
