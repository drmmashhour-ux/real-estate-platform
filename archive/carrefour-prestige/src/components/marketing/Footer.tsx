import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#080808] py-14 text-center">
      <p className="font-sans text-sm font-bold tracking-wide text-white">{PLATFORM_NAME}</p>
      <p className="mt-1 font-serif text-xs text-[#D4AF37]/90 md:text-sm">{PLATFORM_CARREFOUR_NAME}</p>
      <p className="mt-2 text-xs tracking-wide text-[#CCCCCC]/55">Where Prestige Meets Opportunity</p>
      <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-[#CCCCCC]/45">
        Informational tools only — not legal, tax, or investment advice. Consult licensed
        professionals for decisions.
      </p>
    </footer>
  );
}
