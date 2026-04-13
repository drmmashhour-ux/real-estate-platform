/**
 * Value messaging for auth screens — same benefits on signup and login (lead line differs).
 */
const ACCOUNT_BENEFITS = ["save properties", "track listings", "access AI insights"] as const;

export function AuthAccountValueCallout({ variant }: { variant: "signup" | "login" }) {
  const lead = variant === "signup" ? "Create an account to:" : "With your account you can:";
  return (
    <div
      className="mt-5 rounded-xl border border-premium-gold/25 bg-premium-gold/[0.06] px-4 py-3 sm:px-5"
      aria-label="Benefits of a LECIPM account"
    >
      <p className="text-sm font-semibold text-white">{lead}</p>
      <ul className="mt-2.5 space-y-1.5 text-sm leading-snug text-[#C4C4C4]" role="list">
        {ACCOUNT_BENEFITS.map((line) => (
          <li key={line} className="flex gap-2 pl-0.5">
            <span className="shrink-0 font-medium text-premium-gold/90" aria-hidden>
              –
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
