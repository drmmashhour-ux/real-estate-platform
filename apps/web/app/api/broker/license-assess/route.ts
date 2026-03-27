import { NextRequest, NextResponse } from "next/server";
import {
  LICENSE_MANUAL_REVIEW_WARNING,
  assessLicenseAssistFlag,
  validateLicenseFormat,
} from "@/lib/broker/licenseValidation";
import { isOpenAiConfigured, openai } from "@/lib/ai/openai";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST { "license": "..." } — format validation + optional model-assisted hint (no regulatory claim).
 */
export async function POST(request: NextRequest) {
  let body: { license?: string };
  try {
    body = (await request.json()) as { license?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = typeof body.license === "string" ? body.license : "";
  const format = validateLicenseFormat(raw);
  const assistHeuristic = assessLicenseAssistFlag(format.valid ? format.normalized : raw.trim(), format);

  let assist: "looks_valid" | "suspicious" | null = assistHeuristic;
  let assistSource: "heuristic" | "openai" = "heuristic";

  if (format.valid && isOpenAiConfigured()) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 80,
        messages: [
          {
            role: "system",
            content:
              "You assess only whether a mortgage broker license NUMBER string looks plausible in format (not real verification). " +
              'Reply with JSON only: {"assist":"looks_valid"} or {"assist":"suspicious"}. ' +
              "Suspicious if random/gibberish/repeating; looks_valid if plausible alphanumeric id.",
          },
          {
            role: "user",
            content: `License number (format already passed basic checks): "${format.normalized}"`,
          },
        ],
      });
      const text = completion.choices[0]?.message?.content?.trim() ?? "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { assist?: string };
        if (parsed.assist === "looks_valid" || parsed.assist === "suspicious") {
          assist = parsed.assist;
          assistSource = "openai";
        }
      }
    } catch (e) {
      logError("POST /api/broker/license-assess openai", e);
    }
  }

  return NextResponse.json({
    formatValid: format.valid,
    formatReason: format.valid ? undefined : format.reason,
    normalized: format.normalized,
    assist,
    assistSource: format.valid ? assistSource : null,
    warning: LICENSE_MANUAL_REVIEW_WARNING,
  });
}
