export interface PitchSegment {
  id: string;
  title: string;
  before: string;
  after: string;
  uiMapping: string;
  demoAction: string;
}

export const PITCH_BLOCKS: PitchSegment[] = [
  {
    id: "problem",
    title: "Problem",
    before: "Real estate transactions are slow and people make mistakes in contracts.",
    after: "Every year, thousands of Québec real estate transactions are delayed or litigated because of manual drafting errors and non-compliant clauses that the human eye misses.",
    uiMapping: "(No UI - Hook)",
    demoAction: "Start on the main landing page or a blank screen."
  },
  {
    id: "solution",
    title: "Solution",
    before: "We use AI to help people write their real estate forms faster.",
    after: "LECIPM is the first transaction operating system that combines structured form logic with a real-time compliance engine. We don't just generate text; we enforce legality at the point of entry.",
    uiMapping: "Turbo Draft Selection",
    demoAction: "Show the variety of OACIQ-compliant forms ready for drafting."
  },
  {
    id: "demo",
    title: "Product Demo",
    before: "The user fills out a form and the AI reviews it.",
    after: "As the user fills out the offer, our engine detects risks—like missing warranty exclusions or invalid dates—and blocks submission until the draft is perfected and SHA-256 hashed for integrity.",
    uiMapping: "/drafts/[id] (Editor)",
    demoAction: "Type into a field and show the real-time validation triggering."
  },
  {
    id: "compliance",
    title: "Compliance & Trust",
    before: "We have a score that shows if the contract is good.",
    after: "Our proprietary Trust Score and Forensic Audit Log create an immutable trail of every change, ensuring that both the broker and the regulator have 100% confidence in the document's history.",
    uiMapping: "ComplianceScoreCard",
    demoAction: "Hover over the Compliance Score to show the breakdown of rules checked."
  },
  {
    id: "differentiation",
    title: "Differentiation",
    before: "We are better than ChatGPT or DocuSign.",
    after: "DocuSign is for signatures; ChatGPT is for text. LECIPM is for logic. We are the only platform that understands the specific regulatory constraints of the OACIQ while providing a seamless, modern UX.",
    uiMapping: "AI Review Panel",
    demoAction: "Toggle the AI Review to show the automated legal 'redlines' and suggestions."
  },
  {
    id: "business_model",
    title: "Business Model",
    before: "We charge users for each contract they make.",
    after: "We monetize the transaction itself with a $49 pay-per-draft model for unrepresented users and a high-retention SaaS tier for brokers who need to scale their volume safely.",
    uiMapping: "Stripe / Checkout UI",
    demoAction: "Show the simple, one-click payment flow for a final document."
  },
  {
    id: "vision",
    title: "Vision",
    before: "We want to be the biggest real estate site in the world.",
    after: "We are building the trust layer of global real estate. Starting with Québec's high-complexity market, we are creating a standardized, verifiable transaction protocol that can scale anywhere.",
    uiMapping: "Investor Dashboard / Stats",
    demoAction: "End on the Defensibility Dashboard showing network growth and data moat."
  }
];

export function refinePitch(segmentId: string, customPitch?: string): string {
  const block = PITCH_BLOCKS.find(b => b.id === segmentId);
  if (!block) return customPitch || "";
  
  if (customPitch) {
    // Basic refinement rules:
    // 1. Tie to real screens
    // 2. Remove vague words (help, better, faster)
    // 3. Add concrete outcomes
    let refined = customPitch
      .replace(/help/gi, "enforce")
      .replace(/better/gi, "compliant")
      .replace(/faster/gi, "with 90% less manual effort")
      .replace(/use AI/gi, "leverage our proprietary compliance engine");
      
    return refined;
  }
  
  return block.after;
}
