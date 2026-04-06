import { PDFDocument, StandardFonts } from "pdf-lib";
import type { ContractType } from "@/generated/prisma";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand";

const DISCLAIMER =
  "Template only — requires lawyer/notary review before real use. Not legal advice.";

export type ContractPdfInput = {
  type: ContractType;
  buyerName: string;
  sellerName: string;
  propertyAddress: string;
  priceCad: number;
};

export async function generateContractPdfBytes(input: ContractPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldSize = 14;
  const size = 11;
  let y = 720;

  page.drawText(PLATFORM_NAME, {
    x: 50,
    y,
    size: boldSize,
    font,
  });
  y -= 22;
  page.drawText(PLATFORM_CARREFOUR_NAME, { x: 50, y, size, font });
  y -= 28;
  page.drawText(`Contract type: ${input.type}`, { x: 50, y, size, font });
  y -= 20;
  page.drawText(`Buyer: ${input.buyerName}`, { x: 50, y, size, font });
  y -= 20;
  page.drawText(`Seller: ${input.sellerName}`, { x: 50, y, size, font });
  y -= 20;
  page.drawText(`Property: ${input.propertyAddress}`, { x: 50, y, size, font });
  y -= 20;
  page.drawText(`Price (CAD, illustrative): ${input.priceCad.toLocaleString()}`, {
    x: 50,
    y,
    size,
    font,
  });
  y -= 36;
  page.drawText("Signature: _________________________  Date: __________", {
    x: 50,
    y,
    size,
    font,
  });
  y -= 40;
  page.drawText(DISCLAIMER, { x: 50, y, size: 9, font });

  return pdf.save();
}
