import Link from "next/link";

export const dynamic = "force-dynamic";

const BUCKETS = [
  {
    title: "Bucket 1 — Supply",
    items: [
      "First 25 hosts: personal outreach + host referral campaign",
      "First 100 listings: minimum 6 photos, price, calendar, disclosure",
      "Quality: incomplete listing report in admin reports",
      "Translations: FR/AR fallbacks + missing-key alerts (see Localization QA doc)",
    ],
  },
  {
    title: "Bucket 2 — Demand",
    items: [
      "City landing pages + internal links",
      "Featured listings / hosts (campaign module)",
      "Contact-first lead capture when market emphasizes host contact",
      "Waitlist / interest capture where enabled",
    ],
  },
  {
    title: "Bucket 3 — Convert",
    items: [
      "Clear primary CTA per page type (browse vs detail)",
      "Manual booking ops readiness (bookings-ops dashboard)",
      "Host response nudges + SLA transparency",
      "Trust / disclaimer copy localized (EN default, FR/AR)",
    ],
  },
  {
    title: "Bucket 4 — Retain",
    items: [
      "Repeat inquiry reminders (non-spam, rate-limited)",
      "Host response score in trust graph where enabled",
      "Saved search alerts if supported",
      "AI follow-up drafts: approval-only, never auto-send legal/refund content",
    ],
  },
];

export default function AdminLaunchPlaybookPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/growth" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Growth
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">0 → 1000 users — launch playbook</h1>
        <p className="mt-2 text-sm text-slate-400">
          Structured checklist aligned with manager growth events, Syria manual-first mode, and Stripe online path for
          default markets.
        </p>
        <div className="mt-10 space-y-10">
          {BUCKETS.map((b) => (
            <section key={b.title}>
              <h2 className="text-lg font-medium text-amber-200">{b.title}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
                {b.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
