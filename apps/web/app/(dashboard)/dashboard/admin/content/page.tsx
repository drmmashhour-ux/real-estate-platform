const GOLD = "var(--color-premium-gold)";
const CARD = "#121212";

const CONTENT_IDEAS = [
  "How much you need to buy in Montreal",
  "Rent prices Laval",
  "Mortgage tips Quebec",
  "First-time buyer grants & tax credits QC",
  "BNHub vs long-term rent: what landlords should know",
  "FSBO vs broker: net proceeds calculator",
];

const TRAFFIC_CHANNELS = [
  { name: "Facebook groups", tip: "Join local Montreal / Laval housing & newcomer groups; answer questions, then DM warm leads." },
  { name: "Marketplace", tip: "List bait content (free guide) + link to /evaluate or /mortgage in comments." },
  { name: "Instagram", tip: "Reels: 3 tips in 30s + CTA “Free pre-approval” → /mortgage." },
  { name: "TikTok", tip: "Street-level “what $X buys in MTL” — pin comment with LECIPM link." },
];

export const metadata = {
  title: "Content & traffic | Admin",
};

export default function DashboardAdminContentPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
          Organic growth
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Content system</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#B3B3B3]">
          Ideas for posts and lead magnets. Pair with <strong className="text-premium-gold">Sales scripts</strong> for DMs.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 p-6" style={{ background: CARD }}>
        <h2 className="text-lg font-bold text-white">Content ideas</h2>
        <ul className="mt-4 space-y-2 text-sm text-[#D1D5DB]">
          {CONTENT_IDEAS.map((idea) => (
            <li key={idea} className="flex items-start gap-2">
              <span className="text-premium-gold" aria-hidden>
                ✦
              </span>
              {idea}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-premium-gold/25 p-6" style={{ background: CARD }}>
        <h2 className="text-lg font-bold text-white">Traffic strategy panel</h2>
        <p className="mt-1 text-xs text-[#737373]">Where to fish for conversations — pair with DMs from Sales scripts.</p>
        <ul className="mt-4 space-y-4">
          {TRAFFIC_CHANNELS.map((ch) => (
            <li key={ch.name} className="rounded-xl border border-white/10 p-4">
              <p className="font-semibold text-premium-gold">{ch.name}</p>
              <p className="mt-2 text-sm text-[#B3B3B3]">{ch.tip}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
