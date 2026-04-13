import { buildGenerationUserMessage } from "./build-generation-user-message";
import { marketingCompleteJson } from "./completion";
import { emailKindInstructions } from "./templates";
import type { EmailInput, EmailResult } from "./types";

type EmailJson = { subject?: string; body?: string; cta?: string };

function fallbackEmail(input: EmailInput): EmailResult {
  const partner = input.partnerType?.trim() || "partners";
  let subject: string;
  let body: string;
  let cta: string;

  switch (input.emailKind) {
    case "partnership":
      subject = `Partnership idea: BNHUB × ${partner}`;
      body = [
        `Hi — I'm reaching out from BNHUB (LECIPM's stays marketplace).`,
        ``,
        `We're connecting verified hosts with travelers who book with confidence. ${input.topic}`,
        input.context?.trim() ? `\nContext: ${input.context.trim()}` : "",
        ``,
        `If a lightweight pilot (co-marketing or referral intro) makes sense for ${partner}, I'd love a 15-min chat.`,
        ``,
        `Best,`,
        `[Your name]`,
      ]
        .filter(Boolean)
        .join("\n");
      cta = "Reply with a good week to connect.";
      break;
    case "onboarding":
      subject = "Welcome to BNHUB — 3 quick wins";
      body = [
        `Thanks for joining BNHUB.`,
        ``,
        `1) Browse curated stays in your favorite area.`,
        `2) Save listings you love.`,
        `3) Book when you're ready — hosts are verified.`,
        input.context?.trim() ? `\nTip: ${input.context.trim()}` : "",
      ].join("\n");
      cta = "Open BNHUB and explore stays.";
      break;
    default:
      subject = `${input.topic} — something new on BNHUB`;
      body = [
        `Hi —`,
        ``,
        `Quick note on ${input.topic} for ${input.audience}.`,
        input.context?.trim() ? `\n${input.context.trim()}` : "\nDiscover curated stays and host tools on BNHUB.",
        ``,
        `[Campaign details here — keep pricing truthful.]`,
      ].join("\n");
      cta = "See featured stays on BNHUB.";
  }

  return { subject, body, cta, source: "fallback" };
}

/**
 * Marketing / lifecycle email: subject, body, single primary CTA line.
 */
export async function generateEmail(input: EmailInput): Promise<EmailResult> {
  const system = `You write marketing emails for BNHUB (hospitality stays) and LECIPM (real estate ecosystem).
Rules:
- ${emailKindInstructions(input.emailKind)}
- Audience: ${input.audience}. Tone: ${input.tone}.
- No fabricated metrics, legal promises, or fake company details.
- JSON only: {"subject": string, "body": string, "cta": string}
Body: plain text, short paragraphs, no HTML.`;

  const user = buildGenerationUserMessage(
    {
      emailKind: input.emailKind,
      topic: input.topic,
      audience: input.audience,
      tone: input.tone,
      context: input.context ?? "",
      partnerType: input.partnerType ?? "",
      ...(input.variantLabel
        ? {
            variantLabel: input.variantLabel,
            variantOfTotal: input.variantOfTotal ?? 1,
            variantInstruction: "A/B email variant: distinct subject angle and body structure vs other variants.",
          }
        : {}),
    },
    input.feedback
  );

  const tempBump = input.variantLabel ? (input.variantLabel.charCodeAt(0) - 65) * 0.04 : 0;

  const ai = await marketingCompleteJson<EmailJson>({
    system,
    user,
    maxTokens: 950,
    temperature: Math.min(0.72, 0.42 + tempBump),
  });

  if (ai?.data) {
    const { subject, body, cta } = ai.data;
    if (
      typeof subject === "string" &&
      subject.trim() &&
      typeof body === "string" &&
      body.trim() &&
      typeof cta === "string" &&
      cta.trim()
    ) {
      return {
        subject: subject.trim().slice(0, 200),
        body: body.trim().slice(0, 8000),
        cta: cta.trim().slice(0, 400),
        source: ai.source,
      };
    }
  }

  return fallbackEmail(input);
}

export async function generateEmailVariants(input: EmailInput, count: number): Promise<EmailResult[]> {
  const n = Math.min(Math.max(Math.floor(count), 1), 3);
  const out: EmailResult[] = [];
  for (let i = 0; i < n; i++) {
    const label = String.fromCharCode(65 + i);
    out.push(
      await generateEmail({
        ...input,
        variantLabel: label,
        variantOfTotal: n,
      })
    );
  }
  return out;
}
