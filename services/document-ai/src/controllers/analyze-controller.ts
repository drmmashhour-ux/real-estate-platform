/**
 * POST /analyze — accept PDF / PDF-compatible AI file, return extracted fields and confidence.
 */

import type { Request, Response } from "express";
import { extractFromPdfBuffer } from "../services/extraction-service.js";
import { isPdfBuffer } from "../services/upload-validation.js";

export async function analyzeDocument(req: Request, res: Response): Promise<void> {
  try {
    const file = req.file;
    if (!file?.buffer && !file?.path) {
      res.status(400).json({ error: "PDF or Adobe Illustrator (.ai) file required" });
      return;
    }
    const buf = (file as { buffer?: Buffer; path?: string }).buffer ?? (file.path ? await import("node:fs").then((fs) => fs.promises.readFile(file.path)) : null);
    if (!buf) {
      res.status(400).json({ error: "Could not read file content" });
      return;
    }
    if (!isPdfBuffer(buf)) {
      res.status(422).json({
        error: "Unsupported file content. Upload a PDF or export your .ai file with PDF compatibility enabled.",
      });
      return;
    }
    const result = await extractFromPdfBuffer(buf);
    res.json({
      ...result,
      extracted_at: new Date().toISOString(),
      document_id: (req as Request & { body?: { document_id?: string } }).body?.document_id,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: e instanceof Error ? e.message : "Document analysis failed",
    });
  }
}
