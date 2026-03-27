const ITEMS = [
  "Verified Listings",
  "Seller Readiness Score",
  "Broker Verification",
  "Fraud Detection Built-In",
];

export function TrustProofStrip() {
  return (
    <div
      className="mx-auto mt-8 flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-3 border-y border-white/10 py-4 text-xs font-medium uppercase tracking-[0.12em] text-slate-400 sm:text-[0.7rem]"
      aria-label="Trust capabilities"
    >
      {ITEMS.map((label) => (
        <span key={label} className="flex items-center gap-2 text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C9A646] shadow-[0_0_8px_rgba(201,166,70,0.6)]" aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}
