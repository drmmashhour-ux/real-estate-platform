import type { InvestorSlide } from "@/modules/investor-pitch/slide-generator.service";

/** "PPT" export = structured Markdown suitable for Google Slides / Keynote import — no binary .pptx in v1. */
export function exportPitchDeckAsMarkdown(title: string, slides: InvestorSlide[]): { filename: string; body: string } {
  const lines: string[] = [`# ${title}`, ""];
  for (const s of slides) {
    lines.push(`## ${s.id}. ${s.title}`, "");
    for (const b of s.bullets) {
      lines.push(`- ${b}`);
    }
    lines.push("");
  }
  return {
    filename: `lecipm-pitch-deck-${new Date().toISOString().slice(0, 10)}.md`,
    body: lines.join("\n"),
  };
}
