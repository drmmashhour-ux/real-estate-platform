import { openai, isOpenAiConfigured } from "@/lib/ai/openai";
import { polishAdminCopy } from "./llm-helpers";
import { getPlatformSignals } from "./get-platform-signals";
import type { PlatformSignals } from "./types";

export type AdminQueryEntityLink = {
  label: string;
  href: string;
};

export type AdminQueryResult = {
  answer: string;
  entities: AdminQueryEntityLink[];
  grounded: boolean;
};

const SAFE_SYSTEM = `You answer LECIPM admin questions using ONLY the FACTS_JSON block.
If the answer is not in FACTS_JSON, reply exactly: "Not available in current platform signals."
Never invent metrics, user names, or listing titles. No legal advice.`;

function keywordAnswer(q: string, signals: PlatformSignals): AdminQueryResult | null {
  const ql = q.toLowerCase();
  const entities: AdminQueryEntityLink[] = [];

  if (/(wasting|traffic|convert|conversion|inquir)/i.test(ql)) {
    const lines = signals.listings.highTrafficLowConversion.slice(0, 5);
    const parts = lines.map(
      (l) =>
        `${l.kind} ${l.listingId}: ${l.views} views, ${l.contacts} contact clicks` +
        (l.kind === "FSBO" ? ` → /admin/fsbo/${l.listingId}` : "")
    );
    for (const l of lines) {
      if (l.kind === "FSBO") {
        entities.push({
          label: `FSBO ${l.listingId.slice(0, 8)}…`,
          href: `/admin/fsbo/${l.listingId}`,
        });
      }
    }
    return {
      answer:
        parts.length > 0
          ? `High traffic vs low contacts (analytics): ${parts.join("; ")}`
          : "Not available in current platform signals (no high-traffic / low-contact rows).",
      entities,
      grounded: true,
    };
  }

  if (/(broker|help|assisted)/i.test(ql)) {
    return {
      answer: `Users in broker-assisted selling modes (platform/preferred): ${signals.users.brokerAssisted}. New buyer signups (7d): ${signals.users.newBuyers7d}.`,
      entities: [{ label: "Brokers", href: "/admin/brokers" }],
      grounded: true,
    };
  }

  if (/(revenue|money|paid)/i.test(ql)) {
    const d = signals.revenue.totalCents7d - signals.revenue.totalCentsPrev7d;
    return {
      answer: `Paid platform revenue (7d): ${(signals.revenue.totalCents7d / 100).toFixed(2)} CAD; prior 7d: ${(signals.revenue.totalCentsPrev7d / 100).toFixed(2)} CAD; delta: ${(d / 100).toFixed(2)} CAD.`,
      entities: [
        { label: "Revenue dashboard", href: "/admin/revenue" },
        { label: "Finance", href: "/admin/finance" },
      ],
      grounded: true,
    };
  }

  if (/(funnel|leak|drop)/i.test(ql)) {
    const f = signals.funnel
      .map((x) => `${x.name}: ${x.count7d} (7d) vs ${x.countPrev7d} (prior)`)
      .join("; ");
    return {
      answer: `Funnel steps (analytics events): ${f}`,
      entities: [{ label: "Funnel detail", href: "/admin/funnel" }],
      grounded: true,
    };
  }

  if (/(oaciq|document|license)/i.test(ql)) {
    return {
      answer: `Broker license pending (OACIQ-style queue): ${signals.users.oaciqBrokerLicensePending}. Broker tax in review: ${signals.users.brokerTaxPending}. FSBO doc slots open: ${signals.users.documentHelpFsboListings}.`,
      entities: [
        { label: "FSBO admin", href: "/admin/fsbo" },
        { label: "Users", href: "/admin/users" },
      ],
      grounded: true,
    };
  }

  return null;
}

export async function queryAdminAi(question: string): Promise<AdminQueryResult> {
  const q = question.trim();
  if (!q) {
    return { answer: "Ask a question about platform signals.", entities: [], grounded: true };
  }

  const signals = await getPlatformSignals();
  if (!signals) {
    return {
      answer: "Not available in current platform signals.",
      entities: [],
      grounded: false,
    };
  }

  const factsJson = JSON.stringify(signals);
  const quick = keywordAnswer(q, signals);
  if (quick) {
    return quick;
  }

  if (openai && isOpenAiConfigured()) {
    const model = process.env.ADMIN_AI_MODEL?.trim() || "gpt-4o-mini";
    try {
      const res = await openai.chat.completions.create({
        model,
        temperature: 0,
        max_tokens: 600,
        messages: [
          { role: "system", content: SAFE_SYSTEM },
          { role: "user", content: `Question: ${q}\n\nFACTS_JSON:\n${factsJson}` },
        ],
      });
      const text = res.choices[0]?.message?.content?.trim() ?? "";
      return {
        answer: text || "Not available in current platform signals.",
        entities: [{ label: "Platform signals (full)", href: "/admin/assistant" }],
        grounded: true,
      };
    } catch {
      // fall through
    }
  }

  const fallback = await polishAdminCopy({
    task: `Answer this admin question in 2-4 sentences using only FACTS_JSON: ${q}`,
    factsJson,
    fallbackText: "Not available in current platform signals.",
  });

  return {
    answer: fallback,
    entities: [],
    grounded: true,
  };
}
