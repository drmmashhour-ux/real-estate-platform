import { PDFDocument, StandardFonts } from "pdf-lib";

export async function generateContract(data: {
  buyer: string;
  seller: string;
  price: string | number;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const size = 12;

  page.drawText("REAL ESTATE CONTRACT - QUEBEC", { x: 50, y: 700, size: 18, font });
  page.drawText(`Buyer: ${data.buyer}`, { x: 50, y: 650, size, font });
  page.drawText(`Seller: ${data.seller}`, { x: 50, y: 620, size, font });
  page.drawText(`Price: ${data.price}`, { x: 50, y: 590, size, font });

  return await pdfDoc.save();
}
