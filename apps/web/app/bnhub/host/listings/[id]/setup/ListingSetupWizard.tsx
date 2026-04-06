"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DynamicForm } from "@/components/forms/DynamicForm";
import { useI18n } from "@/lib/i18n/I18nContext";
import type { ContractTemplateDefinition } from "@/modules/contracts/templates";
import { LEGAL_RENT_RIGHT_ATTESTATION_SUMMARY } from "@/lib/bnhub/legal-rent-attestation-policy";

type SetupPayload = {
  steps: Record<string, boolean>;
  meta?: {
    photoCount?: number;
    listingStatus?: string;
    listingVerificationStatus?: string;
    legalRentRightAttestedAt?: string | null;
    legalRentRightAttestationVersion?: string | null;
    requiredAttestationVersion?: string;
  };
};

export function ListingSetupWizard({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [status, setStatus] = useState<SetupPayload | null>(null);
  const [def, setDef] = useState<ContractTemplateDefinition | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean | "">>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishReasons, setPublishReasons] = useState<string[]>([]);
  const [attestChecked, setAttestChecked] = useState(false);
  const [attestLoading, setAttestLoading] = useState(false);
  const [attestError, setAttestError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [sRes, tRes] = await Promise.all([
      fetch(`/api/bnhub/listings/${listingId}/setup-status`),
      fetch(`/api/bnhub/listings/${listingId}/template-answers`),
    ]);
    const sJson = await sRes.json();
    const tJson = await tRes.json();
    if (sRes.ok) setStatus(sJson);
    if (tRes.ok && tJson.definition) {
      setDef(tJson.definition as ContractTemplateDefinition);
      const a = tJson.answers;
      if (a && typeof a === "object" && !Array.isArray(a)) {
        setAnswers(a as Record<string, string | number | boolean | "">);
      }
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const done = status?.steps ?? {};
  const stepKeys = ["property", "photos", "details", "disclosure", "contracts", "submit"] as const;
  const completedCount = stepKeys.filter((k) => done[k] === true).length;

  async function handlePublish() {
    setPublishLoading(true);
    setPublishReasons([]);
    try {
      const res = await fetch(`/api/bnhub/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingStatus: "PUBLISHED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPublishReasons(Array.isArray(data.reasons) ? data.reasons : [data.error ?? "Cannot publish"]);
        return;
      }
      router.refresh();
      void load();
    } finally {
      setPublishLoading(false);
    }
  }

  async function handleAttestation() {
    setAttestError(null);
    if (!attestChecked) {
      setAttestError("Check the box to confirm before saving.");
      return;
    }
    setAttestLoading(true);
    try {
      const res = await fetch(`/api/bnhub/host/listings/${listingId}/legal-attestation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setAttestError(data.error ?? "Could not save attestation");
        return;
      }
      setAttestChecked(false);
      void load();
    } finally {
      setAttestLoading(false);
    }
  }

  if (!status) {
    return <p className="text-slate-400">Loading checklist…</p>;
  }

  const pct = Math.round((completedCount / stepKeys.length) * 100);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-slate-400">{listingTitle}</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {completedCount} / {stepKeys.length} steps complete
        </p>
      </div>

      <ol className="space-y-6">
        <li className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-white">1. Property info</span>
            {done.property ? (
              <span className="text-xs text-emerald-400">Done</span>
            ) : (
              <span className="text-xs text-amber-400">Required</span>
            )}
          </div>
          <Link
            href={`/bnhub/host/listings/${listingId}/edit`}
            className="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300"
          >
            Edit address &amp; location →
          </Link>
        </li>

        <li className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-white">2. Photos</span>
            {done.photos ? (
              <span className="text-xs text-emerald-400">Done ({status.meta?.photoCount ?? 0})</span>
            ) : (
              <span className="text-xs text-amber-400">Required</span>
            )}
          </div>
          <Link
            href={`/bnhub/host/listings/${listingId}/edit`}
            className="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300"
          >
            Add photos in listing editor →
          </Link>
        </li>

        <li className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-white">3. Details</span>
            {done.details ? (
              <span className="text-xs text-emerald-400">Done</span>
            ) : (
              <span className="text-xs text-amber-400">Required</span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Description, condition of property, and known issues (use &quot;None&quot; if applicable).
          </p>
          <Link
            href={`/bnhub/host/listings/${listingId}/edit`}
            className="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300"
          >
            Edit details →
          </Link>
        </li>

        <li className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-white">
              4. {t("sellerDeclaration.title")}
            </span>
            {done.disclosure ? (
              <span className="text-xs text-emerald-400">Done</span>
            ) : (
              <span className="text-xs text-amber-400">Required</span>
            )}
          </div>
          <Link
            href={`/bnhub/host/listings/${listingId}/disclosure`}
            className="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300"
          >
            Complete declaration →
          </Link>
        </li>

        <li className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-white">5. Contracts</span>
            {done.contracts ? (
              <span className="text-xs text-emerald-400">Signed</span>
            ) : (
              <span className="text-xs text-amber-400">Required</span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Fill the structured seller agreement fields below, then sign the seller listing agreement and host agreement in
            your contracts area.
          </p>
          {def && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <DynamicForm
                definition={def}
                initialValues={answers}
                submitLabel="Save agreement fields"
                error={formError}
                onSubmit={async (vals) => {
                  setFormError(null);
                  const res = await fetch(`/api/bnhub/listings/${listingId}/template-answers`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answers: vals }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error ?? "Save failed");
                  setAnswers(vals);
                  void load();
                }}
              />
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard/contracts"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Open contracts dashboard →
            </Link>
          </div>
        </li>

        <li className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-white">6. Platform ownership verification</span>
            {done.verification ? (
              <span className="text-xs text-emerald-400">Approved</span>
            ) : (
              <span className="text-xs text-amber-400">Required</span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            An administrator must verify your land register (or broker authorization) and listing details before you can
            go live. Upload documents and submit from the listing editor when your cadastre and province are set.
          </p>
          <Link
            href={`/bnhub/host/listings/${listingId}/edit`}
            className="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300"
          >
            Listing editor &amp; documents →
          </Link>
        </li>

        <li className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-white">7. Legal right to offer this stay</span>
            {done.legalAttestation ? (
              <span className="text-xs text-emerald-400">Confirmed</span>
            ) : (
              <span className="text-xs text-amber-400">Required</span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-400">{LEGAL_RENT_RIGHT_ATTESTATION_SUMMARY}</p>
          {!done.verification && (
            <p className="mt-2 text-sm text-amber-400/90">
              Available after step 6 is approved by the platform.
            </p>
          )}
          {done.verification && !done.legalAttestation && (
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-slate-600"
                  checked={attestChecked}
                  onChange={(e) => setAttestChecked(e.target.checked)}
                />
                <span>I have read the statement above and confirm it is true for this listing.</span>
              </label>
              {attestError && <p className="text-sm text-red-400">{attestError}</p>}
              <button
                type="button"
                disabled={attestLoading}
                onClick={() => void handleAttestation()}
                className="rounded-xl border border-emerald-600/60 bg-emerald-950/40 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-950/70 disabled:opacity-50"
              >
                {attestLoading ? "Saving…" : "Save confirmation"}
              </button>
            </div>
          )}
        </li>

        <li className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-white">8. Submit (publish)</span>
            {done.submit ? (
              <span className="text-xs text-emerald-400">Published</span>
            ) : (
              <span className="text-xs text-slate-400">Draft</span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Publishing runs mandatory checks: host identity, listing quality, disclosure, agreements, admin ownership
            approval, and your legal-right confirmation.
          </p>
          {publishReasons.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-red-400">
              {publishReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            disabled={publishLoading || done.submit}
            onClick={() => void handlePublish()}
            className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {publishLoading ? "Publishing…" : done.submit ? "Already published" : "Publish listing"}
          </button>
        </li>
      </ol>
    </div>
  );
}
