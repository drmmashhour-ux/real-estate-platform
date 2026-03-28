"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { PLATFORM_LEGAL_BUNDLE_VERSION } from "@/lib/legal/platform-legal-version";

export type LegalAgreementModalProps = {
  open: boolean;
  needsPlatformIntermediary: boolean;
  needsBrokerCollaboration: boolean;
  onComplete: () => void;
};

/**
 * Global legal disclosure — intermediary role, user accuracy, party-to-party deals, activity logging.
 * Optional broker collaboration section for brokers/admins.
 */
export function LegalAgreementModal({
  open,
  needsPlatformIntermediary,
  needsBrokerCollaboration,
  onComplete,
}: LegalAgreementModalProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function accept() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/legal/accept-platform-bundle", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acceptPlatform: needsPlatformIntermediary,
          acceptBrokerCollaboration: needsBrokerCollaboration,
          version: PLATFORM_LEGAL_BUNDLE_VERSION,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(typeof j.error === "string" ? j.error : "Could not record acceptance");
      }
      onComplete();
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/85 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="platform-legal-title"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-amber-500/25 bg-[#0f0f0f] p-6 shadow-2xl">
        <h2 id="platform-legal-title" className="text-lg font-semibold text-white">
          Important — platform disclosures
        </h2>
        <p className="mt-2 text-xs text-amber-200/85">
          Please read and confirm before continuing. This is general information, not legal advice for your situation.
        </p>

        {needsPlatformIntermediary ? (
          <section className="mt-5 space-y-3 text-sm leading-relaxed text-slate-300">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Platform role</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                The platform is an <strong className="text-slate-200">intermediary and technology provider</strong>, not
                your lawyer, broker, lender, or tax advisor.
              </li>
              <li>
                <strong className="text-slate-200">You are responsible</strong> for the accuracy of information you post
                or provide, and for verifying listings, documents, and counterparties independently.
              </li>
              <li>
                <strong className="text-slate-200">Transactions are between parties</strong> (buyers, sellers, hosts,
                guests, brokers). The platform facilitates tools and introductions unless a separate written agreement
                says otherwise.
              </li>
              <li>
                <strong className="text-slate-200">Activity may be logged</strong> (including contacts, messages, and
                key actions) for compliance, disputes, and platform safety — as described in our{" "}
                <a className="text-amber-400 underline" href="/legal/privacy" target="_blank" rel="noreferrer">
                  Privacy Policy
                </a>
                .
              </li>
              <li>
                The platform is <strong className="text-slate-200">not liable</strong> for incorrect listings, user
                misconduct, or financial loss; it provides tools and connectivity, not guarantees of outcome.
              </li>
            </ul>
            <p className="text-[11px] text-slate-500">
              Document types recorded: {LEGAL_DOCUMENT_TYPES.PLATFORM_INTERMEDIARY_DISCLOSURE} · v{PLATFORM_LEGAL_BUNDLE_VERSION}
            </p>
          </section>
        ) : null}

        {needsBrokerCollaboration ? (
          <section className="mt-6 space-y-3 text-sm leading-relaxed text-slate-300">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Broker collaboration</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>The platform may facilitate collaboration between brokers (including referrals and commission sharing).</li>
              <li>
                Professional communications tied to platform leads should remain <strong className="text-slate-200">on the platform</strong>{" "}
                where required by workflow — circumventing the platform may affect eligibility or access.
              </li>
              <li>Commission splits and roles follow your brokerage agreements and applicable rules, in addition to platform terms.</li>
            </ul>
            <p className="text-[11px] text-slate-500">
              Document: {LEGAL_DOCUMENT_TYPES.BROKER_COLLABORATION_CLAUSE} · v{PLATFORM_LEGAL_BUNDLE_VERSION}
            </p>
          </section>
        ) : null}

        {err ? <p className="mt-4 text-sm text-red-400">{err}</p> : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => void accept()}
            className="flex-1 rounded-xl bg-premium-gold py-3 text-sm font-bold text-black disabled:opacity-50"
          >
            {busy ? "Saving…" : "I understand and agree"}
          </button>
        </div>
      </div>
    </div>
  );
}
