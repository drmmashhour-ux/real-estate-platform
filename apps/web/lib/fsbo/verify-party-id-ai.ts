import sharp from "sharp";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { logError } from "@/lib/logger";

const MODEL = process.env.FSBO_ID_VERIFY_MODEL?.trim() || "gpt-4o-mini";

export type IdAiVerifyResult = {
  status: "match" | "mismatch" | "inconclusive";
  message: string;
};

/** Public URL for an FSBO party ID upload must contain listing id and party-id path segment. */
export function isPartyIdDocumentUrlTrusted(url: string, listingId: string): boolean {
  if (!url || !listingId) return false;
  try {
    const path = url.startsWith("http://") || url.startsWith("https://")
      ? new URL(url).pathname
      : url.split("?")[0] ?? "";
    const p = path.toLowerCase();
    const lid = listingId.toLowerCase();
    return p.includes(lid) && p.includes("party-id");
  } catch {
    return false;
  }
}

/** Resolve stored document URL for server-side fetch (handles relative `/uploads/...`). */
export function resolveFsboDocFetchUrl(url: string): string {
  const t = url.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const base =
    process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}` : "");
  if (base && t.startsWith("/")) return `${base}${t}`;
  return t;
}

const NOT_ID_MESSAGE =
  "This doesn’t look like a government-issued ID (e.g. food, scenery, or unrelated photos won’t work). Upload a clear, well-lit photo of your passport, driver’s licence, or national ID.";

function parseModelJsonObject(text: string): { status?: string; message?: string } | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const raw = jsonMatch ? jsonMatch[0] : text.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { status?: string; message?: string };
  } catch {
    return null;
  }
}

/**
 * Compare uploaded ID image/PDF to seller-entered fields using vision (images) or inconclusive (PDF).
 * Never throws — callers always get a structured result.
 */
export async function verifyPartyIdAgainstForm(params: {
  buffer: Buffer;
  contentType: string;
  idType: string;
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
}): Promise<IdAiVerifyResult> {
  try {
    return await verifyPartyIdAgainstFormInner(params);
  } catch (e) {
    logError("[verifyPartyIdAgainstForm] unexpected", e);
    return {
      status: "inconclusive",
      message:
        "We couldn’t finish the automated check. Please upload a clear photo of your government-issued ID—not unrelated images—and try again.",
    };
  }
}

async function verifyPartyIdAgainstFormInner(params: {
  buffer: Buffer;
  contentType: string;
  idType: string;
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
}): Promise<IdAiVerifyResult> {
  if (process.env.FSBO_ID_AI_VERIFY === "false") {
    return { status: "inconclusive", message: "Automated ID check is disabled." };
  }

  if (!isOpenAiConfigured() || !openai) {
    return {
      status: "inconclusive",
      message: "AI ID check requires OPENAI_API_KEY. Confirm your details manually below.",
    };
  }

  const ct = (params.contentType || "").toLowerCase();
  const looksPdf =
    ct.includes("pdf") ||
    (params.buffer.length >= 4 && params.buffer.subarray(0, 4).equals(Buffer.from("%PDF")));
  if (looksPdf) {
    return {
      status: "inconclusive",
      message:
        "PDF uploaded — automatic text comparison is limited. Upload a clear photo (JPG/PNG) of the ID for AI matching, or confirm manually.",
    };
  }

  let jpegBuf: Buffer;
  try {
    jpegBuf = await sharp(params.buffer)
      .rotate()
      .resize({ width: 1536, height: 1536, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch (e) {
    logError("[verifyPartyIdAgainstForm] sharp", e);
    return { status: "inconclusive", message: "Could not read this file for AI verification. Try JPG or PNG." };
  }

  const dataUrl = `data:image/jpeg;base64,${jpegBuf.toString("base64")}`;

  const idTypeLabel =
    params.idType === "PASSPORT"
      ? "Passport"
      : params.idType === "DRIVERS_LICENSE"
        ? "Driver license"
        : params.idType === "NATIONAL_ID"
          ? "National ID"
          : params.idType === "OTHER"
            ? "Other ID"
            : params.idType || "Not specified";

  const prompt = `You verify whether an uploaded IMAGE is a government-issued identity document and whether it matches seller-entered data for a real estate declaration.

ENTERED BY SELLER:
- Document type: ${idTypeLabel}
- ID / document number (as typed): ${params.idNumber || "(empty)"}
- Full legal name (as typed): ${params.fullName || "(empty)"}
- Date of birth (as typed, YYYY-MM-DD if provided): ${params.dateOfBirth || "(not provided)"}

STEP 1 — IS THIS AN ID?
- The image must show a passport, driver licence, national ID card, or similar government photo ID with readable text.
- If the image shows food, drinks, pets, landscapes, memes, screenshots of apps, random objects, blank paper, or anything that is clearly NOT an identity document → respond with status "inconclusive" only. In the message, politely ask them to upload a clear photo of their actual ID.

STEP 2 — ONLY IF IT IS AN ID:
- Read visible text (name, number, dates) and decide if entered data PLAUSIBLY matches. Allow different name order, spacing, minor OCR uncertainty.
- If too blurry or unreadable → inconclusive.
- If name or ID number clearly contradicts the document → mismatch.
- If it matches → match.

Reply with ONLY valid JSON (no markdown, no code fences):
{"status":"match"|"mismatch"|"inconclusive","message":"Plain English, max 220 characters"}`;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 320,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });
    const text = (completion.choices[0]?.message?.content ?? "").trim();
    const parsed = parseModelJsonObject(text);
    if (!parsed) {
      return { status: "inconclusive", message: "AI could not interpret the result. Confirm your ID details manually below." };
    }
    const st = parsed.status;
    if (st === "match" || st === "mismatch" || st === "inconclusive") {
      const msg =
        typeof parsed.message === "string" && parsed.message.trim()
          ? parsed.message.trim().slice(0, 400)
          : st === "match"
            ? "Entered details appear consistent with the ID image."
            : st === "mismatch"
              ? "Some entered details do not match what is visible on the ID. Review and correct."
              : NOT_ID_MESSAGE;
      return { status: st, message: msg };
    }
  } catch (e) {
    logError("[verifyPartyIdAgainstForm] openai", e);
    const errMsg = e instanceof Error ? e.message : String(e);
    if (/image|content policy|invalid|vision/i.test(errMsg)) {
      return {
        status: "inconclusive",
        message:
          "This file couldn’t be analyzed as an ID image. Upload a clear, front-facing photo of your government-issued document.",
      };
    }
  }

  return { status: "inconclusive", message: "AI check did not return a clear result. Confirm your details manually." };
}
