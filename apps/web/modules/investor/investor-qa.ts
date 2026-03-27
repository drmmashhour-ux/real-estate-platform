export type InvestorQAItem = {
  id: string;
  question: string;
  answer: string;
  /** Grouping for filter tabs */
  category?: string;
};

/**
 * Investor diligence Q&A — static copy for `/investor/qa` (no API).
 */
export const INVESTOR_QA: InvestorQAItem[] = [
  {
    id: "q1",
    category: "Company",
    question: "What is your company?",
    answer:
      "We are building an all-in-one real estate platform that simplifies buying, selling, renting, and financing through a structured, legally compliant, and AI-powered system.",
  },
  {
    id: "q2",
    category: "Market",
    question: "Why would users switch from existing platforms?",
    answer:
      "Existing platforms are fragmented — buyers, sellers, rentals, and financing all happen in separate systems with limited transparency.\nWe bring everything into one trusted platform with verified listings, enforced legal structure, and lower costs through direct access and automation.",
  },
  {
    id: "q3",
    category: "Execution",
    question: "Why won’t this fail due to complexity?",
    answer:
      "We are not launching everything at once.\nWe start with core flows (buying and listings), then expand modularly.\nEach module is built on the same system, ensuring consistency and scalability.",
  },
  {
    id: "q4",
    category: "Go-to-market",
    question: "How do you acquire your first users?",
    answer:
      "We onboard initial brokers and property owners through direct outreach and partnerships.\nWe attract buyers using free tools like property search, mortgage calculators, and property valuation.\nWe support adoption with a 3-month free trial to build trust.",
  },
  {
    id: "q5",
    category: "Team",
    question: "Why are you the right person to build this?",
    answer:
      "I am a real estate professional with experience in multiple markets, including Canada and the Gulf region.\nI have seen the inefficiencies in the system and built this platform to solve them with a structured and scalable approach.",
  },
  {
    id: "q6",
    category: "Competition",
    question: "Why hasn’t this been done successfully before?",
    answer:
      "Most platforms focus on only one layer — marketplace, management, or brokerage.\nWe connect these layers through a unified legal and operational system, reducing fragmentation while maintaining simplicity.",
  },
  {
    id: "q7",
    category: "NBHub",
    question: "Why would hosts use this instead of Airbnb + Guesty?",
    answer:
      "Today, hosts rely on multiple tools.\nWe unify listings, bookings, contracts, payments, and operations in one system with lower fees and stronger trust mechanisms.",
  },
  {
    id: "q8",
    category: "Differentiation",
    question: "What is your strongest differentiator?",
    answer:
      "We integrate legal structure, verification, and AI directly into the transaction process, ensuring every step is structured, compliant, and trusted.",
  },
];

export function investorQACategories(items: InvestorQAItem[]): string[] {
  const set = new Set<string>();
  for (const row of items) {
    if (row.category) set.add(row.category);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
