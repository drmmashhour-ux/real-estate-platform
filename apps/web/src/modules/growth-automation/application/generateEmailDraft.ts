import { growthAutomationJsonCompletion } from "@/src/modules/growth-automation/infrastructure/growthAutomationLlm";
import type { ContentFamily } from "@/src/modules/growth-automation/domain/growth-automation.types";

export type EmailDraft = {
  subject: string;
  preheader: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl?: string;
  sourceProductOrFeature: string;
};

export async function generateEmailDraft(args: {
  topic: string;
  contentFamily: ContentFamily;
  productOrFeature: string;
  link?: string;
}): Promise<EmailDraft> {
  const res = await growthAutomationJsonCompletion<EmailDraft>({
    system: "Marketing email for LECIPM subscribers. Short, actionable. JSON only. bodyHtml is simple HTML fragments.",
    user: JSON.stringify(args),
    label: "email_draft",
  });
  if (!res.ok) {
    return {
      subject: `${args.topic} — quick read`,
      preheader: "Practical tip for your next offer.",
      bodyHtml: `<p>Hi,</p><p>${args.topic}</p><p><strong>${args.productOrFeature}</strong> keeps your workflow in one place.</p>`,
      ctaLabel: "Open LECIPM",
      ctaUrl: args.link,
      sourceProductOrFeature: args.productOrFeature,
    };
  }
  return res.data;
}
