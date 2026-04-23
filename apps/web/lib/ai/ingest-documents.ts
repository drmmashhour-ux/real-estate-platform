import fs from "node:fs";
import pdfParse from "pdf-parse";

export async function extractPdfText(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  return pdfData.text;
}

export function splitIntoChunks(text: string, size = 1000): string[] {
  const chunks: string[] = [];
  let i = 0;

  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size;
  }

  return chunks;
}
