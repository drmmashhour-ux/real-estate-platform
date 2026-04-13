import type { InvestorQA } from "@prisma/client";
import { loadInvestorReportBundle } from "@/src/modules/investor-metrics/investorReportBundle";

export async function buildInvestorBundleMarkdown(opts: {
  pitchDeckTitle: string | null;
  slides: Array<{ order: number; type: string; title: string; content: unknown }>;
  qa: InvestorQA[];
}): Promise<string> {
  const now = new Date();
  const bundle = await loadInvestorReportBundle(now);
  const metricsBlock = bundle.fullText;

  const pitchIntro = opts.pitchDeckTitle
    ? `# Pitch deck: ${opts.pitchDeckTitle}\n\n`
    : `# Pitch content\n\n`;

  const slidesMd = opts.slides
    .map((s) => {
      const body =
        typeof s.content === "object" && s.content !== null
          ? JSON.stringify(s.content, null, 2)
          : String(s.content ?? "");
      return `## Slide ${s.order + 1}: ${s.title} (${s.type})\n\n${body}\n`;
    })
    .join("\n");

  const qaMd = opts.qa
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime())
    .map((row) => `### ${row.category.toUpperCase()}: ${row.question}\n\n${row.answer}\n`)
    .join("\n");

  return [
    `# LECIPM — investor bundle`,
    ``,
    `Generated: ${now.toISOString()}`,
    ``,
    `---`,
    ``,
    `# Metrics summary`,
    ``,
    metricsBlock.trim(),
    ``,
    `---`,
    ``,
    pitchIntro,
    slidesMd.trim() || `_No pitch deck rows._`,
    ``,
    `---`,
    ``,
    `# Q&A`,
    ``,
    qaMd.trim() || `_No Q&A rows._`,
    ``,
  ].join("\n");
}
