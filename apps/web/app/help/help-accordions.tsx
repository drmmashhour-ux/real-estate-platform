"use client";

import { useState } from "react";
import Link from "next/link";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand/platform";

type Item = { q: string; a: string };

const SECTIONS: { id: string; title: string; items: Item[] }[] = [
  {
    id: "booking",
    title: "Booking & payments",
    items: [
      {
        q: "How do BNHub payments work?",
        a: "Short-stay bookings use Stripe for secure checkout. The host receives payouts according to platform rules once requirements are met. You’ll see confirmation after successful payment.",
      },
      {
        q: "When do I get confirmation?",
        a: `After checkout completes, you’ll receive booking confirmation on ${PLATFORM_CARREFOUR_NAME}. Instant confirmation after payment is the default when the listing allows it.`,
      },
      {
        q: "Are taxes included?",
        a: "Pricing breakdowns show nights, fees, and applicable taxes where configured. Review the total before you pay.",
      },
    ],
  },
  {
    id: "selling",
    title: "Selling property",
    items: [
      {
        q: "FSBO vs broker — what’s the difference?",
        a: "FSBO lets you list with platform tools; full-service broker support adds pricing, marketing, and transaction guidance. Compare options on /sell/compare.",
      },
      {
        q: "Is the evaluation really free?",
        a: "Yes—the online estimate is free and no obligation. A licensed broker may offer a more precise opinion if you choose follow-up.",
      },
      {
        q: "What fees should I expect?",
        a: "FSBO publishing and BNHub stays have stated platform fees. Broker commissions are discussed directly with your broker per mandate.",
      },
    ],
  },
  {
    id: "broker",
    title: "Broker services",
    items: [
      {
        q: "Who is the broker of record for consultations?",
        a: `Mohamed Al Mashhour is the residential real estate broker associated with ${PLATFORM_CARREFOUR_NAME} outreach (license on file). OACIQ rules apply.`,
      },
      {
        q: "How do I reach support?",
        a: "Use contact options on the site, Help center, or your dashboard messages if you have an account.",
      },
    ],
  },
  {
    id: "evaluation",
    title: "Evaluation tool",
    items: [
      {
        q: "How accurate is the AI estimate?",
        a: "It’s indicative—based on the details you enter and internal models—not a formal appraisal. Use it as a starting point.",
      },
      {
        q: "What cities are supported?",
        a: "Montreal, Laval, and Quebec City flows are supported in the public tool—see the evaluation form for the latest list.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact support",
    items: [
      {
        q: "Where do I get more help?",
        a: "Email contact@lecipm.com or use Call / WhatsApp on marketing pages. For account-specific issues, sign in and use dashboard tools where available.",
      },
      {
        q: "How do I report a listing or payment issue?",
        a: "Use site contact channels with booking or listing IDs. Admins and trust workflows may review per platform policies.",
      },
    ],
  },
];

export function HelpAccordions() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-12">
      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id}>
          <h2 className="text-lg font-bold text-[#C9A646]">{section.title}</h2>
          <ul className="mt-4 space-y-2">
            {section.items.map((item, idx) => {
              const key = `${section.id}-${idx}`;
              const isOpen = open === key;
              return (
                <li key={key} className="rounded-xl border border-white/10 bg-[#121212]">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : key)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-white"
                  >
                    {item.q}
                    <span className="text-[#C9A646]" aria-hidden>
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-white/5 px-4 pb-4 pt-0 text-sm leading-relaxed text-[#B3B3B3]">
                      {item.a}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="text-center text-sm text-[#737373]">
        New here?{" "}
        <Link href="/how-it-works" className="text-[#C9A646] hover:underline">
          How {PLATFORM_NAME} works
        </Link>
      </p>
    </div>
  );
}
