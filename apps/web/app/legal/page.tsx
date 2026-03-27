import Link from "next/link";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_OPERATOR } from "@/lib/brand/platform";
import { LEGAL_PATHS, LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";

export const metadata = {
  title: "Legal center",
  description: `Terms, privacy, copyright, and platform legal notices — ${PLATFORM_CARREFOUR_NAME} (${PLATFORM_OPERATOR}).`,
};

const LINKS: { href: string; label: string; detail: string }[] = [
  { href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.TERMS], label: "Terms of Service", detail: "Platform rules, commissions, liability, Québec law." },
  {
    href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.PLATFORM_ACKNOWLEDGMENT],
    label: "Platform acknowledgment",
    detail: "Facilitator role, licensing, disclosures, AI & calculator disclaimers.",
  },
  { href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.PRIVACY], label: "Privacy Policy", detail: "Data collection, use, Stripe payments, and rights." },
  { href: "/legal/copyright", label: "Copyright & ownership", detail: "IP, branding, software, and database rights." },
  { href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.COOKIES], label: "Cookie Policy", detail: "Cookies and similar technologies." },
  { href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.PLATFORM_USAGE], label: "Platform usage", detail: "Additional hub and conduct rules." },
  { href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.BROKER_AGREEMENT], label: "Broker agreement", detail: "Professional and brokerage terms." },
  { href: "/legal/hosting-terms", label: "Hosting terms", detail: "BNHub / short-term listings." },
  {
    href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.BNHUB_LONG_TERM_RENTAL_AGREEMENT],
    label: "BNHub long-term rental",
    detail: "Landlord and tenant terms for monthly leases.",
  },
  {
    href: LEGAL_PATHS[LEGAL_DOCUMENT_TYPES.BNHUB_BROKER_COLLABORATION_AGREEMENT],
    label: "BNHub broker collaboration",
    detail: "Lead referral, commission splits, and broker obligations.",
  },
  { href: "/legal/developer-terms", label: "Developer terms", detail: "Projects and developer hub." },
];

export default function LegalCenterPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C9A646]">Legal</p>
        <h1 className="mt-3 text-3xl font-bold">Legal center</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3]">
          Transparent terms for{" "}
          <strong className="text-[#E8C547]">{PLATFORM_CARREFOUR_NAME}</strong> ({PLATFORM_OPERATOR}),
          Québec. Documents may be updated; the effective version is the one published here (or as linked
          from checkout and onboarding).
        </p>
        <ul className="mt-10 space-y-3">
          {LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-2xl border border-[#C9A646]/30 bg-[#121212] px-5 py-4 transition-colors hover:border-[#C9A646]/55 hover:bg-[#1a1a1a]"
              >
                <span className="font-semibold text-[#E8C547]">{item.label}</span>
                <span className="mt-1 block text-sm text-[#9CA3AF]">{item.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-xs text-[#737373]">
          French summaries may be available under <Link href="/fr/legal/terms" className="text-[#C9A646] hover:underline">/fr/legal</Link>.
          For binding interpretation in case of discrepancy between unofficial translations, the English
          published legal text on this site prevails unless applicable law requires otherwise.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm font-medium text-[#C9A646] hover:underline">
          ← Home
        </Link>
      </div>
    </main>
  );
}
