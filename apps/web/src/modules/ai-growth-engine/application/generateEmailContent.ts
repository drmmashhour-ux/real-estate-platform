import type { EmailContent } from "@/src/modules/ai-growth-engine/domain/growth.types";
import { growthJsonCompletion } from "@/src/modules/ai-growth-engine/infrastructure/growthLlm";

const SYSTEM = `Write a short internal marketing email (Markdown body). CASL-aware tone: useful, not pushy. JSON only.`;

export async function generateEmailContent(args: { topic: string; goal?: string }): Promise<EmailContent> {
  const out = await growthJsonCompletion<EmailContent>({
    system: SYSTEM,
    user: JSON.stringify({
      topic: args.topic,
      goal: args.goal ?? "nurture",
      fields: ["subject", "preheader", "bodyMarkdown", "ctaLabel", "ctaUrlPlaceholder"],
    }),
  });
  if (!out.ok) {
    return {
      subject: `This week: ${args.topic}`,
      preheader: "Educational — one practical takeaway.",
      bodyMarkdown: `## ${args.topic}\n\nQuick overview for your next step (not legal advice).\n\n— LECIPM`,
      ctaLabel: "Open your dashboard",
      ctaUrlPlaceholder: "https://example.com/dashboard",
    };
  }
  return out.data;
}
