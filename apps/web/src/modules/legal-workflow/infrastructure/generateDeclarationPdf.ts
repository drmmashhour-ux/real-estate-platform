import { declarationPdfTemplate } from "@/src/modules/legal-workflow/infrastructure/declarationPdfTemplate";

export function generateDeclarationPdf(args: {
  documentId: string;
  payload: Record<string, unknown>;
  validationSummary?: Record<string, unknown> | null;
}) {
  const generatedAtIso = new Date().toISOString();
  const body = declarationPdfTemplate({ ...args, generatedAtIso });
  const pseudoPdf = `%PDF-1.1
%LECIPM
${body}
%%EOF`;
  return {
    fileName: `seller-declaration-${args.documentId}.pdf`,
    mimeType: "application/pdf",
    contentBase64: Buffer.from(pseudoPdf, "utf8").toString("base64"),
    generatedAtIso,
  };
}
