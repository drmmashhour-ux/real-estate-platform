import type { AvatarScriptContext } from "@/src/modules/ai-avatar/domain/avatar.types";

export type AvatarScriptBundle = {
  context: AvatarScriptContext;
  lines: string[];
  fullText: string;
  disclaimer: string;
};

const DISCLAIMER =
  "AI explainer for LECIPM — not a real person and not legal or brokerage advice. Confirm important decisions with a licensed professional.";

const SCRIPTS: Record<AvatarScriptContext, string[]> = {
  onboarding: [
    "Welcome to LECIPM — your workspace for property decisions.",
    "Choose your path, run a quick analysis, and explore trust and deal signals step by step.",
  ],
  simulator: [
    "The offer simulator illustrates scenarios from your inputs — not a guarantee of outcomes.",
    "Compare conservative and aggressive paths, then review risk notes with your broker.",
  ],
  negotiation: [
    "Negotiation tools organize structure and flags — they don’t replace professional representation.",
    "Document terms clearly before you commit.",
  ],
  drafting: [
    "Drafting uses templates and suggestions you control.",
    "Read each section and use explanations before you sign.",
  ],
  upgrade: [
    "Pro adds more simulations and drafting capacity when you’re ready.",
    "You can stay on Free to explore first.",
  ],
};

export function generateAvatarScript(context: AvatarScriptContext): AvatarScriptBundle {
  const lines = SCRIPTS[context] ?? SCRIPTS.onboarding;
  const fullText = lines.join(" ");
  return { context, lines, fullText, disclaimer: DISCLAIMER };
}
