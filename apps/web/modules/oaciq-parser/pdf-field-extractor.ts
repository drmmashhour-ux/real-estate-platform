import { PDFDocument, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFSignature, PDFTextField } from "pdf-lib";
import type { OaciqPdfFieldKind } from "@prisma/client";

export type ExtractedPdfField = {
  /** Raw AcroForm name from the PDF (stable identifier within file). */
  rawName: string;
  /** Normalized key safe for storage (slug). */
  normalizedKey: string;
  label: string;
  fieldType: OaciqPdfFieldKind;
  page?: number;
  required?: boolean;
  metadata: Record<string, unknown>;
};

function mapPdfFieldKind(field: import("pdf-lib").PDFField): OaciqPdfFieldKind {
  if (field instanceof PDFTextField) return "text";
  if (field instanceof PDFCheckBox) return "checkbox";
  if (field instanceof PDFSignature) return "signature";
  if (field instanceof PDFDropdown || field instanceof PDFRadioGroup) return "dropdown";
  return "unknown";
}

function normalizeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 180);
}

/**
 * Extract AcroForm fields from an uploaded PDF. Non-interactive PDFs return an empty list (no guessing).
 */
export async function extractPdfFormFields(pdfBytes: Uint8Array): Promise<ExtractedPdfField[]> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = doc.getForm();
  const fields = form.getFields();
  const out: ExtractedPdfField[] = [];

  for (const f of fields) {
    const rawName = f.getName();
    const normalizedKey = normalizeKey(rawName) || `field_${out.length}`;
    const fieldType = mapPdfFieldKind(f);

    out.push({
      rawName,
      normalizedKey,
      label: rawName,
      fieldType,
      page: undefined,
      metadata: {
        fullyQualifiedName:
          typeof (f as unknown as { getFullyQualifiedName?: () => string }).getFullyQualifiedName === "function"
            ? (f as unknown as { getFullyQualifiedName: () => string }).getFullyQualifiedName()
            : rawName,
      },
    });
  }

  return out;
}
