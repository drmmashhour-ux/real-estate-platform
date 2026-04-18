import type { PitchDeckContent } from "@/modules/pitch-content/pitch-content.types";
import type { PdfReadyPitchPayload, PitchExportFormat } from "./founder-export.types";

export function pitchDeckToMarkdown(deck: PitchDeckContent): string {
  const lines: string[] = [
    `# ${deck.companyName} — pitch (estimate / not audited)`,
    "",
    `_Generated ${deck.generatedAt}_`,
    "",
    ...deck.disclaimers.map((d) => `> ${d}`),
    "",
  ];
  for (const s of deck.slides) {
    lines.push(`## Slide ${s.slideNumber} — ${s.title}`);
    lines.push("");
    lines.push(`**${s.headline}**`);
    lines.push("");
    for (const b of s.bullets) {
      lines.push(`- ${b}`);
    }
    lines.push("");
    lines.push("**Speaker notes**");
    lines.push("");
    lines.push(s.speakerNotes);
    if (s.optionalVisualSuggestion) {
      lines.push("");
      lines.push(`_Visual: ${s.optionalVisualSuggestion}_`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function pitchDeckToPdfReadyPayload(deck: PitchDeckContent): PdfReadyPitchPayload {
  return {
    kind: "pdf_ready_pitch_v1",
    generatedAt: deck.generatedAt,
    title: deck.companyName,
    slides: deck.slides.map((s) => ({
      slideNumber: s.slideNumber,
      title: s.title,
      headline: s.headline,
      bullets: s.bullets,
      speakerNotes: s.speakerNotes,
      optionalVisualSuggestion: s.optionalVisualSuggestion,
    })),
    disclaimers: deck.disclaimers,
  };
}

export function buildPitchExport(
  format: PitchExportFormat,
  deck: PitchDeckContent
): { contentType: string; filename: string; body: string } {
  const stamp = new Date().toISOString().slice(0, 10);
  switch (format) {
    case "markdown":
      return {
        contentType: "text/markdown; charset=utf-8",
        filename: `lecipm-pitch-${stamp}.md`,
        body: pitchDeckToMarkdown(deck),
      };
    case "deck_structured":
      return {
        contentType: "application/json; charset=utf-8",
        filename: `lecipm-pitch-deck-${stamp}.json`,
        body: JSON.stringify(deck, null, 2),
      };
    case "pdf_payload":
      return {
        contentType: "application/json; charset=utf-8",
        filename: `lecipm-pitch-pdf-ready-${stamp}.json`,
        body: JSON.stringify(pitchDeckToPdfReadyPayload(deck), null, 2),
      };
    case "json":
    default:
      return {
        contentType: "application/json; charset=utf-8",
        filename: `lecipm-pitch-${stamp}.json`,
        body: JSON.stringify(deck, null, 2),
      };
  }
}
