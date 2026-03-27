/**
 * Platform pillar cards on the home page (#features) and /features/[slug] detail pages.
 */

export type PlatformFeatureDetail = {
  slug: string;
  title: string;
  /** Short copy for the card grid (also shown on the detail page as a summary line). */
  description: string;
  /** Opening paragraph on the detail page */
  intro: string;
  /** Extra paragraphs shown after “Learn more” — full description for this pillar */
  detailParagraphs: string[];
  bullets: string[];
};

export const PLATFORM_FEATURES: PlatformFeatureDetail[] = [
  {
    slug: "dashboard",
    title: "Dashboard",
    description: "One place to see pipeline health, priorities, and team activity — without opening five tools.",
    intro:
      "Your command center for the brokerage: open deals, stalled stages, and follow-ups surface automatically so managers and brokers start the day knowing what matters.",
    detailParagraphs: [
      "Instead of stitching together spreadsheets and inbox searches, the dashboard pulls from the same CRM, listings, and tasks your team already uses — so numbers and names match what people see in their daily workflow.",
      "Filters and role-aware views mean an agent sees their book of business while leadership sees coverage, velocity, and risk — without exporting to a separate BI stack.",
    ],
    bullets: [
      "At-a-glance pipeline and listing activity tied to live data",
      "Role-aware views for brokers vs. managers",
      "Fewer “where did that number come from?” moments at standups",
    ],
  },
  {
    slug: "crm-clients",
    title: "CRM & clients",
    description: "Pipeline, contacts, and ownership in one place — no orphan leads.",
    intro:
      "Bring every conversation, deal stage, and assignment into a single CRM so brokers always know who owns the relationship and what happens next.",
    detailParagraphs: [
      "Instead of juggling spreadsheets, inboxes, and separate contact apps, your team works from one record per person and per deal. Handoffs between agents are explicit, so a lead never sits unanswered because everyone thought someone else was handling it.",
      "Reporting and filters are tuned to brokerage workflows: by stage, by listing, by broker, and by source — so managers can coach from real pipeline data, not gut feel.",
    ],
    bullets: [
      "Pipeline stages with clear ownership and handoffs",
      "Contact history tied to listings, projects, and offers",
      "Filters and views built for brokerage teams, not generic sales tools",
    ],
  },
  {
    slug: "offers-contracts",
    title: "Offers & contracts",
    description: "Negotiate offers and generate contracts with structured status and history.",
    intro:
      "Structure the offer lifecycle from first draft through acceptance so nothing depends on scattered email threads or ad-hoc PDFs.",
    detailParagraphs: [
      "Each offer carries a clear status and timeline: submitted, countered, accepted, or declined — with history you can review later for compliance or training.",
      "As you grow, you can plug in your own templates and approval steps; the platform keeps the thread of negotiation in one place instead of version twelve of a Word file.",
    ],
    bullets: [
      "Status and timestamps for each offer revision",
      "History that auditors and brokers can trust",
      "Room to connect templates and compliance workflows as you scale",
    ],
  },
  {
    slug: "document-deal-rooms",
    title: "Document deal rooms",
    description: "Secure rooms linked to deals — disclosures, IDs, and signatures together.",
    intro:
      "Keep sensitive documents in context: each deal room hangs off the transaction, not a random folder in someone’s inbox.",
    detailParagraphs: [
      "Buyers, sellers, and professionals see the right documents for their role, without broadcasting private files to everyone on the thread.",
      "At closing, you spend less time hunting for the “final final” PDF — because the deal room is the single place where finalized packets live.",
    ],
    bullets: [
      "Documents grouped by deal and role",
      "Clear place for disclosures, ID, and signature packets",
      "Less chasing attachments during closing",
    ],
  },
  {
    slug: "messaging",
    title: "Messaging",
    description: "Threads tied to clients and deals so context never leaves the record.",
    intro:
      "Message clients and partners with the deal in view — so follow-ups stay tied to the right file, not a lost chat thread.",
    detailParagraphs: [
      "When a client asks a question, anyone on the team can see prior messages in the same place as the listing or offer — no more “forwarding the whole chain” to catch up.",
      "That reduces errors (wrong price, wrong address) and speeds up answers, because the context is already on screen.",
    ],
    bullets: [
      "Threads associated with contacts and transactions",
      "Faster answers because everyone sees the same context",
      "Fewer “which property was that?” moments",
    ],
  },
  {
    slug: "scheduling",
    title: "Scheduling",
    description: "Visits and appointments synced with broker–client availability.",
    intro:
      "Coordinate showings and meetings without double-booking or endless back-and-forth outside the platform.",
    detailParagraphs: [
      "Showings and callbacks stay associated with the listing and the client, so your calendar reflects real business — not a parallel set of personal invites nobody else can see.",
      "Teams get a clearer picture of who is meeting whom, which helps coverage on busy weekends and reduces no-shows through better coordination.",
    ],
    bullets: [
      "Appointments linked to listings and clients where supported",
      "Clear visibility for the broker team",
      "Less calendar chaos during busy weekends",
    ],
  },
  {
    slug: "commissions-invoices",
    title: "Commissions & invoices",
    description: "Revenue, payouts, and billing artifacts without exporting spreadsheets.",
    intro:
      "Track splits, charges, and payout logic in one place so finance and brokers share one source of truth.",
    detailParagraphs: [
      "Deals drive revenue: when commission rules live next to the transaction, you reduce disputes and manual reconciliation at month-end.",
      "Export or hand off to accounting when needed — without rebuilding numbers from scratch every time a deal changes.",
    ],
    bullets: [
      "Commission and invoice flows aligned to your deals",
      "Exports when you need them — without spreadsheet gymnastics",
      "Better handoff between production and accounting",
    ],
  },
  {
    slug: "notifications-tasks",
    title: "Notifications & tasks",
    description: "Reminders and follow-ups so nothing slips between stages.",
    intro:
      "Turn pipeline noise into actionable tasks: nudges when deals stall and reminders before deadlines.",
    detailParagraphs: [
      "Brokers get reminded about what matters — follow up with this buyer, send this document — instead of relying on memory or side chats.",
      "Managers can see which opportunities are idle, so coaching and support happen before a deal goes cold.",
    ],
    bullets: [
      "Tasks tied to deals and clients",
      "Notifications that respect roles and ownership",
      "Less reliance on sticky notes and side channels",
    ],
  },
  {
    slug: "lead-intake",
    title: "Lead intake & inquiries",
    description: "Capture contact forms and public inquiries — routed into CRM with clear follow-up.",
    intro:
      "When someone reaches out from your site or a campaign, their inquiry becomes a first-class lead with attribution and next steps — not a lost email.",
    detailParagraphs: [
      "Marketing pages, contact forms, and campaigns can all feed the same pipeline, so you measure what actually converts — not just clicks.",
      "Optional channels like SMS or voice follow-up build on the same record, with consent and preferences stored so you stay compliant while responding fast.",
    ],
    bullets: [
      "Structured intake from marketing pages and forms",
      "Routing into the same CRM the team uses daily",
      "Foundation for SMS, voice, and AI follow-up where you enable it",
    ],
  },
];

export function getPlatformFeatureBySlug(slug: string): PlatformFeatureDetail | undefined {
  return PLATFORM_FEATURES.find((f) => f.slug === slug);
}

export function getAllPlatformFeatureSlugs(): string[] {
  return PLATFORM_FEATURES.map((f) => f.slug);
}
