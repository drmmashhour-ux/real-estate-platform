export interface Interruption {
  id: string;
  question: string;
  idealPoints: string[];
  modelAnswer: string;
}

export const INTERRUPTIONS: Interruption[] = [
  {
    id: "overengineering",
    question: "Stop. Why do you need multiple apps? That sounds like overengineering.",
    idealPoints: [
      "Separation of concerns",
      "Independent scaling",
      "Isolate sensitive operations (admin/compliance)",
      "Evolution needs of different surfaces"
    ],
    modelAnswer: "It’s about separation of concerns. Each surface—consumer, broker, admin—has different performance and security needs. This lets us scale BNHub independently while isolating sensitive compliance operations."
  },
  {
    id: "infrastructure_only",
    question: "Okay… but what’s the actual product here? This sounds like infrastructure.",
    idealPoints: [
      "Decision layer",
      "Guiding smarter decisions",
      "Value is in the output, not just the data",
      "Transaction flow integration"
    ],
    modelAnswer: "The product is the decision layer. Users don’t just browse listings—they understand which properties are better decisions and why. The value is in guiding those decisions, not just showing data."
  },
  {
    id: "why_pay",
    question: "Why would anyone pay for that?",
    idealPoints: [
      "Reducing uncertainty",
      "High-stakes decisions",
      "Financial impact of clarity",
      "Outcome over features"
    ],
    modelAnswer: "Because real estate decisions are high-stakes. If we reduce uncertainty—even slightly—that has a real financial impact. Users pay for clarity and outcomes, not just features."
  },
  {
    id: "vs_chatgpt_refined",
    question: "Isn’t this just ChatGPT with a UI?",
    idealPoints: [
      "Structured signals vs raw text",
      "Ranking logic",
      "Explainable outputs",
      "Integrated transaction flow"
    ],
    modelAnswer: "No. ChatGPT generates text. We combine structured signals, ranking logic, and explainable outputs integrated into the transaction flow. We’re not generating answers—we’re guiding decisions."
  },
  {
    id: "moat_refined",
    question: "What’s your moat?",
    idealPoints: [
      "Structured data + signals",
      "Explainable decision logic",
      "Search-to-transaction integration",
      "Hard to replicate as a bundle"
    ],
    modelAnswer: "Three layers: Structured signals, explainable decision logic, and integration across the entire search-to-transaction flow. Individually, these can be copied. Together, they are extremely hard to replicate."
  },
  {
    id: "scaling",
    question: "How do you scale this?",
    idealPoints: [
      "Independent scaling of surfaces",
      "BNHub supply/demand growth",
      "Broker tools B2B adoption",
      "Green layer cross-value"
    ],
    modelAnswer: "The architecture allows independent scaling. BNHub grows supply/demand, while broker tools drive B2B adoption. The Green layer sits across both, increasing the value for every user."
  },
  {
    id: "green_skepticism",
    question: "What if users don’t care about ‘green’?",
    idealPoints: [
      "Value over sustainability",
      "Identifying better properties",
      "Not about ideology",
      "Direct financial utility"
    ],
    modelAnswer: "We don’t sell ‘green’ as sustainability. We sell it as value. It’s about identifying better, smarter properties—not ideology. It's direct financial utility."
  },
  {
    id: "first_revenue",
    question: "What’s your first revenue?",
    idealPoints: [
      "Transaction-based fees",
      "Premium insights",
      "Prioritize usage before pricing optimization",
      "Monetizing the decision gate"
    ],
    modelAnswer: "Transaction-based fees and early premium insights. We prioritize real usage and decision-layer adoption before optimizing the final pricing model."
  },
  {
    id: "why_win",
    question: "Why will you win?",
    idealPoints: [
      "Building a decision layer, not a tool",
      "Value-centric approach",
      "Long-term leverage in the decision gate",
      "Integrated across the full flow"
    ],
    modelAnswer: "Because we’re not building a marketplace or a tool. We’re building a decision layer on top of real estate. That’s where the real user value—and long-term leverage—exists."
  },
  {
    id: "why_now",
    question: "Why now? What has changed that makes this a priority today?",
    idealPoints: [
      "AI maturity for complex drafting",
      "Law 25 (privacy) and compliance pressure in Québec",
      "Brokers seeking efficiency to compete with direct sales"
    ],
    modelAnswer: "AI has finally reached the reliability needed for structured drafting. Combined with new privacy laws like Law 25 and a market demanding more transparency, the timing for a compliance-first transaction layer is perfect."
  },
  {
    id: "vs_chatgpt",
    question: "Why can’t ChatGPT do this? Can't users just prompt their way to an offer?",
    idealPoints: [
      "Generic AI hallucination risks",
      "Lack of structured legal logic",
      "No real-time compliance validation"
    ],
    modelAnswer: "Generic AI generates text, but it doesn’t enforce structure or compliance. We combine AI with strict validation and domain-specific rules, which is critical in regulated transactions where a single error is costly."
  },
  {
    id: "traction",
    question: "What’s your traction? Are brokers actually using this?",
    idealPoints: [
      "Early adopter cohort in Québec",
      "Successful pilot transactions",
      "Focus on low friction onboarding"
    ],
    modelAnswer: "We're currently in a closed beta with early-adopter brokers in Québec. We've validated the drafting speed increase and are now focusing on conversion from trial to paid usage."
  },
  {
    id: "monetization",
    question: "How do you make money? What's the business model?",
    idealPoints: [
      "Pay-per-contract for unrepresented users",
      "Broker toolkit subscription or usage fee",
      "Lead generation for high-value services"
    ],
    modelAnswer: "Our primary revenue comes from a pay-per-contract fee for unrepresented buyers and sellers. For professionals, we offer a toolkit with usage-based billing, aligning our success with their transaction volume."
  },
  {
    id: "is_legal",
    question: "Is this legal? Are you providing legal advice?",
    idealPoints: [
      "Assistive drafting tool, not legal advice",
      "Transparent disclaimers",
      "Compliance-driven framework"
    ],
    modelAnswer: "We are a compliance-driven assistive layer. The platform guides the user through structured forms based on existing regulations. We explicitly do not provide legal advice, but we ensure the user remains within safe drafting guardrails."
  },
  {
    id: "moat",
    question: "What’s your moat? How do you stop a bigger player from copying this?",
    idealPoints: [
      "Domain-specific compliance logic",
      "Proprietary audit and trust layer",
      "Data advantage from Québec-specific transactions"
    ],
    modelAnswer: "Our moat is the deep integration of Québec-specific compliance rules with real-time AI validation. It's not just a wrapper; it's a domain-specific operating system that builds trust and audit trails that generic players can't easily replicate."
  },
  {
    id: "adoption",
    question: "What if brokers don’t adopt? They are notoriously slow to change.",
    idealPoints: [
      "Focus on reducing friction",
      "Direct-to-consumer entry to create demand",
      "Demonstrating risk reduction"
    ],
    modelAnswer: "We address this by making the tool low-friction and focusing on immediate risk reduction. Additionally, our consumer-facing drafting tool creates a 'pull' effect where brokers use it because their clients are already there."
  },
  {
    id: "quebec_first",
    question: "Why Québec first? It's a small and unique market.",
    idealPoints: [
      "Strict compliance environment (OACIQ)",
      "Focused test bed for the system",
      "High complexity makes the problem acute"
    ],
    modelAnswer: "Québec's strict regulatory environment makes it the perfect stress test. If we can solve the transaction complexity and compliance here, we can scale to any regulated real estate market globally."
  }
];

export function getRandomInterruption(): Interruption {
  const index = Math.floor(Math.random() * INTERRUPTIONS.length);
  return INTERRUPTIONS[index];
}

export function evaluateResponse(response: string, interruption: Interruption) {
  const wordCount = response.split(' ').length;
  
  // Simple heuristic evaluation
  let clarityScore = 80;
  let concisenessScore = wordCount < 30 ? 95 : wordCount < 50 ? 80 : 60;
  let confidenceScore = response.includes("I think") || response.includes("maybe") ? 60 : 90;
  
  // Basic point matching (mock logic)
  const completeness = interruption.idealPoints.filter(point => 
    response.toLowerCase().includes(point.split(' ')[0].toLowerCase())
  ).length / interruption.idealPoints.length;
  
  const completenessScore = Math.round(completeness * 100);
  
  const overallScore = Math.round((clarityScore + concisenessScore + confidenceScore + completenessScore) / 4);

  return {
    score: overallScore,
    whatWasGood: overallScore > 75 ? "Direct and confident answer." : "Good attempt at answering the core concern.",
    whatToImprove: wordCount > 40 ? "Try to be more concise. Aim for under 30 words." : "Ensure you cover all key strategic points.",
    betterAnswer: interruption.modelAnswer
  };
}
