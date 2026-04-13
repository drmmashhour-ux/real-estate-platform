import type { ReactNode } from "react";
import { getCountryBySlug } from "@/config/countries";

/** Jurisdiction banner: URL already encodes `/[locale]/[country]/legal/...`; this surfaces it for clarity. */
export default async function LegalSegmentLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const def = getCountryBySlug(country);
  const label = def?.name ?? country.toUpperCase();

  return (
    <div className="legal-jurisdiction-root">
      <p className="mx-auto max-w-2xl px-4 pt-8 text-center text-xs text-neutral-500 sm:px-6">
        Legal content applies to <span className="font-medium text-neutral-300">{label}</span>.
      </p>
      {children}
    </div>
  );
}
