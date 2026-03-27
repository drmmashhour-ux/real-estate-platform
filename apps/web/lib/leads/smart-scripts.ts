import { normalizePipelineStage, type SalesPipelineStage } from "@/lib/leads/pipeline-stage";

export type SuggestedScript = {
  stage: SalesPipelineStage | "terminal";
  title: string;
  opening: string;
  questions: string;
  valueStatement: string;
  closingQuestion: string;
  /** Bullets for call mode */
  keyQuestions: string[];
};

/**
 * Dynamic script by pipeline stage — opening, discovery, value, close.
 */
export function getSuggestedScript(lead: {
  pipelineStatus?: string | null;
  name?: string | null;
  city?: string | null;
  propertyType?: string | null;
  dealValue?: number | null;
}): SuggestedScript {
  const stage = normalizePipelineStage(lead.pipelineStatus);
  const first = lead.name?.trim().split(/\s+/)[0] || "there";
  const city = lead.city?.trim() || "your area";
  const type = lead.propertyType?.trim() || "property";
  const valueLine =
    lead.dealValue != null && lead.dealValue > 0
      ? `The online estimate was around $${lead.dealValue.toLocaleString()}—I’d love to sanity-check that with recent sales nearby.`
      : `I’d love to understand your goals and timeline so we price this correctly for today’s market in ${city}.`;

  if (stage === "won" || stage === "lost") {
    return {
      stage: "terminal",
      title: stage === "won" ? "Post-close" : "Nurture / archive",
      opening: `Hi ${first}, it’s Mohamed from LECIPM — checking in now that we’ve wrapped this stage.`,
      questions: "Is there anything else you need from me on paperwork, referrals, or your next move?",
      valueStatement:
        "I’m here for the long term—if you need a market update later or know someone buying or selling, I’m happy to help.",
      closingQuestion: "What’s the best way to stay in touch—email or quick call in a few weeks?",
      keyQuestions: ["Any open items?", "Referrals?", "Preferred follow-up channel?"],
    };
  }

  if (stage === "new") {
    return {
      stage: "new",
      title: "First contact",
      opening: `Hi ${first}, this is Mohamed Al Mashhour from LECIPM. I’m calling about the free property evaluation—you had a moment?`,
      questions: `Quick questions: are you leaning toward selling in the next few months, and what matters most to you—speed, price, or minimal hassle? How long have you owned the ${type}?`,
      valueStatement: `${valueLine} My job is to make the numbers real with comparables and a simple plan—no pressure.`,
      closingQuestion:
        "Would a short follow-up work—15 minutes—so I can give you a clearer range and next steps?",
      keyQuestions: [
        "Timeline to sell?",
        "Main goal: price vs speed?",
        "Any renovations or updates done recently?",
      ],
    };
  }

  if (stage === "contacted") {
    return {
      stage: "contacted",
      title: "Follow-up",
      opening: `Hi ${first}, Mohamed from LECIPM again—I’m following up on your evaluation and wanted to see if you had any questions on the range.`,
      questions: `What felt high, low, or surprising? Have you spoken with other brokers, or are you still gathering information?`,
      valueStatement:
        "Many sellers want both certainty and flexibility—I can show you how similar homes actually sold lately in " +
        city +
        ", not just list prices.",
      closingQuestion: "If it’s helpful, I can send a one-page market snapshot—does morning or evening work better for a quick call?",
      keyQuestions: ["Reactions to the estimate?", "Comparing options?", "Best time to reconnect?"],
    };
  }

  if (stage === "qualified") {
    return {
      stage: "qualified",
      title: "Meeting / discovery",
      opening: `Thanks ${first}—before we meet, I want to use your time well. I’m licensed with LECIPM and here to align on pricing, marketing, and timing.`,
      questions: `Walk me through your ideal sale: move date, must-haves on price, and how you want showings handled. Any concerns about commission or process?`,
      valueStatement:
        "I’ll bring comparables, a simple marketing outline, and a net sheet so you see proceeds after fees—not surprises.",
      closingQuestion:
        "Can we lock a time this week for a consultation at your place or by video—what’s your availability?",
      keyQuestions: ["Target move date?", "Showing preferences?", "Questions on fees or contract?"],
    };
  }

  if (stage === "meeting_scheduled") {
    return {
      stage: "meeting_scheduled",
      title: "Meeting confirmation",
      opening: `Hi ${first}, confirming our appointment with LECIPM—I’m looking forward to walking through the plan for your ${type}.`,
      questions:
        "Do you have recent tax bills or renovation invoices handy? Any must-disclose items I should know before we list?",
      valueStatement:
        "We’ll confirm pricing strategy, staging/light repairs if needed, and how offers and negotiations work in Quebec.",
      closingQuestion: "Still good for our scheduled time—need to adjust by a few minutes?",
      keyQuestions: ["Documents ready?", "Access for photos?", "Decision-makers present?"],
    };
  }

  if (stage === "negotiation") {
    return {
      stage: "negotiation",
      title: "Negotiation",
      opening: `Hi ${first}, we’re aligning on the listing plan—Mohamed from LECIPM.`,
      questions:
        "Are you comfortable with the suggested list range and marketing plan? Any last concerns on timeline or commission?",
      valueStatement:
        "I’ll put net proceeds, staging, and offer strategy in writing so you’re never guessing.",
      closingQuestion:
        "If the plan makes sense, are you ready to set a firm date to sign paperwork and go live?",
      keyQuestions: ["List price sign-off?", "Marketing OK?", "Paperwork timeline?"],
    };
  }

  // closing + default advanced stage
  return {
    stage: "closing",
    title: "Final closing",
    opening: `Hi ${first}, we’re at the final step—Mohamed from LECIPM, making this simple and clear.`,
    questions:
      "Is there anything still unclear about fees, timeline, or what happens next once we sign?",
    valueStatement:
      "Based on your needs, the best next step is to move forward now so we can secure the best opportunity and avoid delays.",
    closingQuestion:
      "If you’re ready, I’ll send the engagement summary—can we confirm today so we don’t lose momentum?",
    keyQuestions: ["Last concerns?", "Sign-off today?", "Who else needs to approve?"],
  };
}
