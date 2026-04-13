"use client";

import Link from "next/link";
import { useState } from "react";

export function ListYourPropertyFinancingStrip() {
  return (
    <section
      className="mt-14 rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/40 to-black/50 p-6 sm:p-8"
      aria-labelledby="financing-heading"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/90">Financing desk</p>
          <h2 id="financing-heading" className="mt-2 font-serif text-xl font-semibold text-white">
            Explore rates & pre-approvals
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Linked to our mortgage section — platform mortgage experts receive priority when you tag financing in Leads
            Hub.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/mortgage?from=list-your-property&intent=financing"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-cyan-500/90 px-5 text-sm font-semibold text-black hover:brightness-110"
          >
            Mortgage experts
          </Link>
          <Link
            href="/dashboard/mortgage"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/20 px-5 text-sm font-medium text-white hover:border-cyan-400/40"
          >
            Mortgage dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is the 1% vs $599 broker document option?",
    a: "The 1% model (+ GST & QST) ties brokerage compensation to a completed transaction. The $599 option (+ GST & QST) is a fixed drafting package for a complete document bundle under broker desk standards. A written agreement defines what is included. Notary and third-party fees are separate.",
  },
  {
    q: "Are prices tax-included?",
    a: "All brokerage fees advertised on this page are plus applicable federal GST and Québec QST, invoiced according to tax rules for real estate services.",
  },
  {
    q: "How do I sell without a traditional listing desk?",
    a: "Intake runs on platform AI: your uploads are classified and checked; you receive an F-reference and can continue in Seller Hub. Paid tiers add reach and analytics — not a substitute for your notary or lender.",
  },
  {
    q: "What happens after I choose a paid plan?",
    a: "Checkout uses the seller subscription tiers shown above. Features unlock in your account according to plan; exact legal and tax outcomes depend on your situation.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes — upgrade or downgrade subject to checkout terms and any minimum periods shown at purchase.",
  },
  {
    q: "How are Leads Hub routes used?",
    a: "We tag real-estate vs mortgage interest, urgency (hot / mid / long-term), and property segment. Mortgage-tagged leads prioritize platform mortgage experts before external resale.",
  },
  {
    q: "Are payment links secure?",
    a: "Payments for subscriptions run through our checkout flow; we do not ask for card numbers by email.",
  },
  {
    q: "Is this legal advice?",
    a: "No. Platform copy and AI outputs are informational. Binding documents are executed with licensed professionals.",
  },
];

export function ListYourPropertyFaq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mt-16 scroll-mt-24" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="font-serif text-xl font-semibold text-white sm:text-2xl">
        Frequently asked questions
      </h2>
      <ul className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.q}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium text-slate-200 hover:bg-white/[0.03]"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                {item.q}
                <span className="shrink-0 text-premium-gold">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen ? <p className="border-t border-white/5 px-4 pb-4 text-sm leading-relaxed text-slate-400">{item.a}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ListYourPropertyLegalFootnotes() {
  return (
    <footer className="mt-14 border-t border-white/10 pt-8 text-[11px] leading-relaxed text-slate-500">
      <p className="font-medium text-slate-400">Disclosures</p>
      <ol className="mt-3 list-decimal space-y-2 pl-4">
        <li>Features depend on the plan active on your account at the time of use.</li>
        <li>Illustrative comparisons to a hypothetical 5% total brokerage commission are marketing examples only — not a guarantee of savings.</li>
        <li>Québec and municipal rules may affect publication, rentals, and strata regimes — verify with qualified advisors.</li>
        <li>Mortgage routing prioritizes platform mortgage experts for financing-tagged Leads Hub entries; external brokers may be introduced per platform policy.</li>
        <li>Refund and cancellation terms are stated at checkout and in your seller agreements.</li>
        <li>AI outputs may be wrong — you remain responsible for listing accuracy and compliance.</li>
        <li>
          Brokerage document services require a licensed broker, a written agreement, and fees stated plus applicable
          taxes. OACIQ rules and notarial requirements apply to binding instruments.
        </li>
      </ol>
    </footer>
  );
}
