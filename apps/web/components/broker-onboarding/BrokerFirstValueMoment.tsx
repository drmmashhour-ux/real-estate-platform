"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const EXAMPLES = [
  {
    id: "e1",
    name: "Alex M.",
    hint: "High intent · downtown condo",
    score: "78%",
    action: "Suggest a same-day callback",
  },
  {
    id: "e2",
    name: "Samira K.",
    hint: "Investor · pre-approval on file",
    score: "71%",
    action: "Book a short virtual tour",
  },
  {
    id: "e3",
    name: "Jordan P.",
    hint: "Relocation · 30-day window",
    score: "66%",
    action: "Send neighborhood pack + 2 listings",
  },
];

type Props = { locale: string; country: string };

export function BrokerFirstValueMoment({ locale, country }: Props) {
  const base = `/${locale}/${country}`;
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    if (marked) return;
    void fetch("/api/onboarding/broker-profile", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstValueShown: true }),
    })
      .then(() => setMarked(true))
      .catch(() => setMarked(true));
  }, [marked]);

  return (
    <div className="space-y-8 text-white">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Your first leads &amp; insights</h1>
        <p className="mt-2 text-sm text-white/70">
          Example data so you see the experience in under two minutes — your real inquiries will appear in the same workspace.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-gold/90">Example leads</h2>
        <ul className="mt-4 space-y-3">
          {EXAMPLES.map((e) => (
            <li key={e.id} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{e.name}</p>
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[11px] text-violet-100">AI {e.score}</span>
              </div>
              <p className="mt-1 text-xs text-white/60">{e.hint}</p>
              <p className="mt-2 text-sm text-slate-200">
                <span className="text-white/50">Suggestion:</span> {e.action}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-sky-500/25 bg-sky-950/30 p-4">
          <h2 className="text-sm font-semibold text-sky-100">Deal insights</h2>
          <p className="mt-2 text-sm text-slate-200">
            Stalled follow-ups and warm leads surface first so you know what to protect this week.
          </p>
          <p className="mt-3 text-xs text-slate-500">Shown in your CRM under pipeline health and “deals at risk”.</p>
        </div>
        <div className="rounded-2xl border border-violet-500/25 bg-violet-950/25 p-4">
          <h2 className="text-sm font-semibold text-violet-100">AI suggestions</h2>
          <p className="mt-2 text-sm text-slate-200">
            Draft replies, next-best actions, and playbooks are assistive only — you edit before anything goes out.
          </p>
          <p className="mt-3 text-xs text-slate-500">No auto-messaging. Safe mode stays on for outbound.</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`${base}/dashboard/crm`}
          className="inline-flex rounded-xl bg-brand-gold px-6 py-3 text-sm font-semibold text-black hover:bg-brand-gold/90"
        >
          Open your CRM
        </Link>
        <Link
          href={`${base}/onboarding/broker`}
          className="inline-flex rounded-xl border border-white/20 px-5 py-3 text-sm text-white/90 hover:bg-white/10"
        >
          License &amp; LECIPM setup
        </Link>
      </div>
    </div>
  );
}
