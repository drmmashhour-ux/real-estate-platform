import type { OaciqFormFamily, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { extractPdfFormFields } from "./pdf-field-extractor";
import { buildSchemaFromExtractedAndRegistry } from "./form-schema-builder";

/**
 * Parse uploaded PDF, persist template + field rows. Does not invent fields beyond AcroForm + registry merge.
 */
export async function ingestOaciqTemplateFromPdf(input: {
  formFamily: OaciqFormFamily;
  pdfBytes: Uint8Array;
  sourcePdfKey?: string;
  versionLabel?: string;
}) {
  const extracted = await extractPdfFormFields(input.pdfBytes);
  const built = buildSchemaFromExtractedAndRegistry(input.formFamily, extracted);

  const template = await prisma.oaciqFormTemplate.create({
    data: {
      formFamily: input.formFamily,
      versionLabel: input.versionLabel ?? null,
      sourcePdfKey: input.sourcePdfKey ?? null,
      schema: built as unknown as Prisma.InputJsonValue,
      extractedFieldCount: extracted.length,
    },
  });

  if (extracted.length > 0) {
    await prisma.oaciqFormField.createMany({
      data: extracted.map((e) => ({
        templateId: template.id,
        fieldKey: e.normalizedKey,
        label: e.label,
        fieldType: e.fieldType,
        section: null,
        page: e.page ?? null,
        required: e.required ?? null,
        metadata: e.metadata as Prisma.InputJsonValue,
      })),
    });
  }

  return prisma.oaciqFormTemplate.findUnique({
    where: { id: template.id },
    include: { fields: true },
  });
}

/** Registry-only template (no PDF) — for offices using specimen definitions without a new upload. */
export async function createRegistryBackedTemplate(input: { formFamily: OaciqFormFamily; versionLabel?: string }) {
  const built = buildSchemaFromExtractedAndRegistry(input.formFamily, []);
  return prisma.oaciqFormTemplate.create({
    data: {
      formFamily: input.formFamily,
      versionLabel: input.versionLabel ?? null,
      schema: built as unknown as Prisma.InputJsonValue,
      extractedFieldCount: 0,
    },
  });
}
