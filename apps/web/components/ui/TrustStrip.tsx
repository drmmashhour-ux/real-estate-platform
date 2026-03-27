/**
 * Compact trust row for checkout / payments — Stripe-level reassurance.
 */
export function TrustStrip({
  dense = false,
  variant = "dark",
  /** `stays` = short-term rental copy (e.g. BNHub); default = brokerage / platform copy */
  audience = "default",
}: {
  dense?: boolean;
  variant?: "light" | "dark";
  audience?: "default" | "stays";
}) {
  const third =
    audience === "stays"
      ? { t: "Verified hosts", s: "Identity-verified where applicable" }
      : { t: "Verified brokers", s: "Licensed where required" };
  const items = [
    { t: "Secure checkout", s: "Stripe · PCI DSS" },
    { t: "Encrypted", s: "TLS 1.2+" },
    third,
  ];
  const shell =
    variant === "dark"
      ? "border-slate-700/80 bg-slate-900/50"
      : "border-stone-200 bg-stone-50";
  const titleC = variant === "dark" ? "text-slate-100" : "text-stone-900";
  const subC = variant === "dark" ? "text-slate-400" : "text-stone-500";
  const iconBg = variant === "dark" ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700";

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border px-4 ${dense ? "py-2" : "py-3"} ${shell}`}
      role="group"
      aria-label="Trust and security"
    >
      {items.map((x) => (
        <div key={x.t} className="flex items-center gap-2 text-start">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBg}`}
            aria-hidden
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </span>
          <div>
            <p className={`text-xs font-semibold ${titleC}`}>{x.t}</p>
            <p className={`text-[11px] ${subC}`}>{x.s}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
