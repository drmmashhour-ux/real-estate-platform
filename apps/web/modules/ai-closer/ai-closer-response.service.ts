import type {
  AiCloserObjectionKey,
  AiCloserResponsePack,
  AiCloserRouteContext,
  AiCloserStage,
  AiCloserPersonalityHint,
} from "./ai-closer.types";
import { getObjectionPlaybook } from "./ai-closer-objection.service";

function personalityTone(h: AiCloserPersonalityHint): string {
  switch (h) {
    case "analytical":
      return "Use concise bullets and explicit next steps.";
    case "driver":
      return "Short, outcome-first; binary choices.";
    case "expressive":
      return "Warm, enthusiastic, but still one clear ask.";
    case "amiable":
      return "Reassuring, collaborative tone; soft deadlines.";
    default:
      return "Neutral-professional.";
  }
}

export function generateCloserResponses(input: {
  stage: AiCloserStage;
  objection: AiCloserObjectionKey;
  route: AiCloserRouteContext;
  personality?: AiCloserPersonalityHint;
  listingHint?: string;
}): AiCloserResponsePack {
  const pb = getObjectionPlaybook(input.objection);
  const tone = personalityTone(input.personality ?? "unknown");
  const label = input.listingHint ? ` about ${input.listingHint}` : "";

  if (pb) {
    const main = `${pb.acknowledgment} ${pb.reframe}`.replace(/\s+/g, " ").trim();
    const alt1 = `${pb.nextStep}`;
    const alt2 =
      input.route === "centris"
        ? `If this home is close to what you want, the clearest next step is to pick a short visit window on LECIPM — I’m the assistant, not the listing broker.`
        : `If it helps, we can compare one alternative and still pick a low-pressure time to see this one.`;

    return {
      main,
      alternatives: [alt1, alt2],
      bestCta: pb.nextStep,
      confidence: 0.72,
    };
  }

  switch (input.stage) {
    case "READY_TO_BOOK":
      return {
        main: `Would you like to visit this week or next${label}? I’m the LECIPM assistant — I can line up timing for the broker to confirm.`,
        alternatives: [
          `I can help you book a visit quickly — morning or evening better?`,
          `Binary choice: should we aim for weekday lunch or Saturday morning?`,
        ],
        bestCta: "Pick this week vs next — then morning vs evening.",
        confidence: 0.78,
      };
    case "HESITATING":
      return {
        main: `Totally fair — if it’s close to what you want, the next best step is usually a short visit so you’re not debating blind.`,
        alternatives: [
          `What’s the one detail that would make this an easy yes after you see it?`,
          `Would a 20‑minute walkthrough lower the uncertainty compared to more photos?`,
        ],
        bestCta: "Offer a narrow visit window choice.",
        confidence: 0.65,
      };
    case "QUALIFIED":
      return {
        main: `Sounds like there’s real fit — want me to propose two visit times for the broker to approve?`,
        alternatives: [
          `If budget is the worry, want comps in the same neighborhood before locking time?`,
          `Should we line up a quick call with the broker or go straight to a showing request?`,
        ],
        bestCta: "Two-slot calendar proposal.",
        confidence: 0.7,
      };
    case "ESCALATE_TO_BROKER":
      return {
        main: `I’m going to route this to a human broker — I’m the LECIPM assistant and can’t replace licensed advice.`,
        alternatives: [
          `Expect a broker follow-up for paperwork and availability.`,
          `If urgent, tell me morning vs evening preference and I’ll attach it to the escalation.`,
        ],
        bestCta: "Confirm contact preference for broker callback.",
        confidence: 0.85,
      };
    default:
      return {
        main: `Thanks for the detail — would it help if I summarized the next step in one sentence${label}?`,
        alternatives: [
          `Want a quick compare vs similar listings before you invest more time?`,
          `Style hint: ${tone}`,
        ],
        bestCta: "Ask one qualifying question.",
        confidence: 0.55,
      };
  }
}
