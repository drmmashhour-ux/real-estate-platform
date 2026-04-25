import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/db";
import { recordProductionGuardAudit } from "./audit-service";

/**
 * Builds a minimal PDF for the final draft, hashes canonical text + PDF bytes, persists artifact row.
 */
export async function sealFinalDraftPdf(input: {
  dealId: string;
  dealDocumentId?: string | null;
  createdById?: string | null;
  title: string;
  canonicalText: string;
}): Promise<{ contentSha256: string; pdfSha256: string; artifactId: string }> {
  const contentSha256 = createHash("sha256").update(input.canonicalText, "utf8").digest("hex");

  const pdf = await PDFDocument.create();
  pdf.setTitle(input.title);
  pdf.setProducer("LECIPM ProductionGuard");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.addPage([612, 792]);
  const margin = 48;
  let y = 720;
  const lines = input.canonicalText.split("\n");
  for (const line of lines) {
    page.drawText(line.slice(0, 120), { x: margin, y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
    y -= 12;
    if (y < 60) break;
  }
  page.drawText(`Content SHA-256: ${contentSha256}`, { x: margin, y: 40, size: 8, font, color: rgb(0.2, 0.2, 0.5) });

  const pdfBytes = await pdf.save({ useObjectStreams: false });
  const pdfSha256 = createHash("sha256").update(Buffer.from(pdfBytes)).digest("hex");

  const row = await prisma.lecipmProductionGuardArtifact.create({
    data: {
      dealId: input.dealId,
      dealDocumentId: input.dealDocumentId ?? null,
      kind: "final_draft_pdf",
      contentSha256,
      pdfSha256,
      createdById: input.createdById ?? null,
    },
  });

  await recordProductionGuardAudit({
    dealId: input.dealId,
    actorUserId: input.createdById,
    action: "final_pdf_sealed",
    entityType: "artifact",
    entityId: row.id,
    metadata: { contentSha256, pdfSha256 },
  });

  return { contentSha256, pdfSha256, artifactId: row.id };
}
