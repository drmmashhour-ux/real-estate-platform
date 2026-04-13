/**
 * Shared urgency copy — rates not guaranteed until paid (BNHub booking + checkout).
 */
export function BnhubPriceMayIncreaseHint({ variant = "light" }: { variant?: "light" | "dark" }) {
  const shell =
    variant === "dark"
      ? "border-amber-500/35 bg-amber-950/35 text-amber-100"
      : "border-amber-200 bg-amber-50/95 text-amber-950";
  return (
    <p
      className={`rounded-lg border px-3 py-2 text-[11px] leading-snug ${shell}`}
      role="note"
    >
      <span className="font-semibold">Price may increase</span>
      {" — "}
      Nightly rates and fees can change until you complete payment. Book to lock this quote.
    </p>
  );
}
