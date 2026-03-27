/**
 * Extract raw text from PDF buffer.
 * Uses pdf-parse for Node.js PDF text extraction.
 */

export async function extractTextFromPdf(buffer: Buffer): Promise<{ text: string; pages: number }> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return {
      text: typeof data.text === "string" ? data.text : "",
      pages: data.numpages ?? 1,
    };
  } catch (e) {
    return { text: "", pages: 0 };
  }
}
