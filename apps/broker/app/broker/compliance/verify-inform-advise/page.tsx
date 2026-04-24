"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Bundle = {
  framework: string;
  messages: Record<string, string>;
  inspection: { buyerMustBeAdvised: boolean; preInspectionNotEnough: boolean };
  pricing: { minComparables: number; forbidden: readonly string[] };
};

export default function OaciqVerifyInformAdvisePage() {
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/compliance/oaciq/verify-inform-advise", { credentials: "same-origin" });
        const data = (await res.json()) as { success?: boolean; bundle?: Bundle; error?: string };
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Failed to load");
          return;
        }
        setBundle(data.bundle ?? null);
      } catch {
        setError("Network error");
      }
    })();
  }, []);

  return (
    <div className="space-y-6 p-6 text-white">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-[#D4AF37]">Verify → Inform → Advise</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/70">
          OACIQ core duty for every broker action and every AI-assisted output. The platform encodes gates; you verify
          sources, disclose objectively, and advise only on verified facts. Final decision is always yours.
        </p>
      </div>

      <Link href="/dashboard/broker/compliance/health" className="text-sm text-[#D4AF37] underline-offset-2 hover:underline">
        ← Compliance health
      </Link>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}

      {bundle ? (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold text-[#D4AF37]">Duty chain</h2>
            <p className="mt-2 text-sm text-white/80">{bundle.framework.replaceAll("_", " ")}</p>
            <ul className="mt-3 list-inside list-disc text-sm text-white/65">
              <li>
                <span className="text-white/90">Verify</span> — reliable sources, consistency, missing data flagged.
              </li>
              <li>
                <span className="text-white/90">Inform</span> — material facts, no bias or omission.
              </li>
              <li>
                <span className="text-white/90">Advise</span> — only when verification is complete for that point.
              </li>
              <li>
                <span className="text-white/90">Sign</span> — broker review, confirmation, signature before submission.
              </li>
            </ul>
          </section>
          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold text-[#D4AF37]">Inspection &amp; pricing</h2>
            <p className="mt-2 text-sm text-white/75">
              Inspection: buyer advised — pre-sale inspection does not replace professional inspection (
              {bundle.inspection.buyerMustBeAdvised ? "required flag" : "n/a"}).
            </p>
            <p className="mt-2 text-sm text-white/75">
              Pricing: suggestions need at least {bundle.pricing.minComparables} comparables in-engine; never guess or
              fabricate unsupported estimates.
            </p>
          </section>
          <section className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-4 md:col-span-2">
            <h2 className="text-sm font-semibold text-amber-200">Mandatory messages</h2>
            <p className="mt-2 text-sm text-white/85">
              <span className="text-white/50">EN:</span> {bundle.messages.verifyBeforeAdviceEn}
            </p>
            <p className="mt-2 text-sm text-white/85">
              <span className="text-white/50">FR:</span> {bundle.messages.verifyBeforeAdviceFr}
            </p>
          </section>
        </div>
      ) : !error ? (
        <p className="text-sm text-white/50">Loading reference…</p>
      ) : null}
    </div>
  );
}
