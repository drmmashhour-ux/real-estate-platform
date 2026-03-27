"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nContext";
import {
  emptySellerDeclarationFormData,
  mergeFormDataFromRecord,
  validateSellerDeclarationForSubmission,
  type SellerDeclarationFormData,
  type TriState,
} from "@/lib/bnhub/seller-declaration-form-data";

type Disclosure = {
  id: string;
  structuralIssues: string | null;
  waterDamage: string | null;
  renovations: string | null;
  defects: string | null;
  formData: unknown | null;
  completedAt: string | null;
  declinedAt: string | null;
} | null;

function TriRadio({
  value,
  onChange,
  name,
}: {
  value: TriState;
  onChange: (v: TriState) => void;
  name: string;
}) {
  return (
    <div className="flex flex-wrap gap-4">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
        <input type="radio" name={name} checked={value === "yes"} onChange={() => onChange("yes")} />
        Yes
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
        <input type="radio" name={name} checked={value === "no"} onChange={() => onChange("no")} />
        No
      </label>
    </div>
  );
}

export function SellerDisclosureForm({
  listingId,
  listingSnapshot,
  initialDisclosure,
}: {
  listingId: string;
  listingSnapshot: {
    address: string;
    city: string;
    cadastreNumber: string | null;
    propertyType: string | null;
  };
  initialDisclosure: Disclosure;
}) {
  const { t } = useI18n();
  const sellerDeclarationTitle = t("sellerDeclaration.title");
  const router = useRouter();
  const [fd, setFd] = useState<SellerDeclarationFormData>(() => {
    const base = emptySellerDeclarationFormData();
    base.propertyIdentification = {
      address: `${listingSnapshot.address}, ${listingSnapshot.city}`,
      cadastreNumber: listingSnapshot.cadastreNumber ?? "",
      propertyType: listingSnapshot.propertyType ?? "",
      yearBuilt: "",
    };
    return base;
  });
  const [loading, setLoading] = useState(false);
  const [declineLoading, setDeclineLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    if (!initialDisclosure) return;
    if (initialDisclosure.formData) {
      const parsed = mergeFormDataFromRecord(initialDisclosure.formData);
      setFd((prev) => ({
        ...prev,
        ...parsed,
        propertyIdentification: {
          ...prev.propertyIdentification,
          ...parsed.propertyIdentification,
        },
      }));
    }
    setCompleted(Boolean(initialDisclosure.completedAt));
    setDeclined(Boolean(initialDisclosure.declinedAt));
  }, [initialDisclosure]);

  function patch<K extends keyof SellerDeclarationFormData>(key: K, value: SellerDeclarationFormData[K]) {
    setFd((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const toValidate: SellerDeclarationFormData = {
      ...fd,
      signature: {
        ...fd.signature,
        agreed: true,
        typedName: fd.signature?.typedName?.trim(),
      },
    };
    const validationError = validateSellerDeclarationForSubmission(toValidate);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload: SellerDeclarationFormData = {
        ...toValidate,
        signature: {
          ...toValidate.signature,
          agreed: true,
          typedName: toValidate.signature?.typedName?.trim(),
        },
      };
      const res = await fetch(`/api/bnhub/listings/${listingId}/disclosure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: payload,
          declined: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setCompleted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecline() {
    if (
      !confirm(
        t("sellerDeclaration.declineConfirm", { title: sellerDeclarationTitle })
      )
    )
      return;
    setError("");
    setDeclineLoading(true);
    try {
      const res = await fetch(`/api/bnhub/listings/${listingId}/disclosure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ declined: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setDeclined(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setDeclineLoading(false);
    }
  }

  if (completed) {
    return (
      <div className="rounded-2xl border border-emerald-800 bg-emerald-950/30 p-6">
        <p className="font-medium text-emerald-300">
          {t("sellerDeclaration.statusCompleted", { title: sellerDeclarationTitle })}
        </p>
        <p className="mt-1 text-sm text-slate-400">You can publish this listing once all other requirements are met.</p>
        <Link
          href={`/bnhub/host/listings/${listingId}/edit`}
          className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          Back to edit listing →
        </Link>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="rounded-2xl border border-amber-800 bg-amber-950/30 p-6">
        <p className="font-medium text-amber-300">
          {t("sellerDeclaration.statusDeclined", { title: sellerDeclarationTitle })}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {t("sellerDeclaration.mustCompletePublishing", { title: sellerDeclarationTitle })}
        </p>
        <p className="mt-2 text-sm text-slate-400">You can submit the declaration below to enable publishing.</p>
        <button
          type="button"
          onClick={() => setDeclined(false)}
          className="mt-4 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          Complete declaration now
        </button>
      </div>
    );
  }

  const setCond = (partial: Partial<NonNullable<SellerDeclarationFormData["condition"]>>) => {
    patch("condition", { ...fd.condition, ...partial });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <p className="text-sm text-slate-400">
        Complete all sections. This declaration is required before publishing. You may also review the{" "}
        <Link href="/legal/seller-declaration-property" className="text-emerald-400 hover:text-emerald-300">
          reference template
        </Link>{" "}
        (legal center).
      </p>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">1. Property identification</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-400">Property address</span>
            <input
              value={fd.propertyIdentification?.address ?? ""}
              onChange={(e) =>
                patch("propertyIdentification", { ...fd.propertyIdentification, address: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Cadaster number</span>
            <input
              value={fd.propertyIdentification?.cadastreNumber ?? ""}
              onChange={(e) =>
                patch("propertyIdentification", { ...fd.propertyIdentification, cadastreNumber: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Property type</span>
            <input
              value={fd.propertyIdentification?.propertyType ?? ""}
              onChange={(e) =>
                patch("propertyIdentification", { ...fd.propertyIdentification, propertyType: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Year built</span>
            <input
              value={fd.propertyIdentification?.yearBuilt ?? ""}
              onChange={(e) =>
                patch("propertyIdentification", { ...fd.propertyIdentification, yearBuilt: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">2. Ownership</h2>
        <p className="text-sm text-slate-400">I confirm that:</p>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(fd.ownership?.isLegalOwnerOrAuthorized)}
            onChange={(e) => patch("ownership", { ...fd.ownership, isLegalOwnerOrAuthorized: e.target.checked })}
          />
          I am the legal owner OR authorized to sell
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(fd.ownership?.noHiddenOwnership)}
            onChange={(e) => patch("ownership", { ...fd.ownership, noHiddenOwnership: e.target.checked })}
          />
          No hidden ownership exists
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(fd.ownership?.notUnderDispute)}
            onChange={(e) => patch("ownership", { ...fd.ownership, notUnderDispute: e.target.checked })}
          />
          Property is not under dispute
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">3. Property condition</h2>
        <p className="text-sm text-slate-400">To the best of my knowledge (yes / no):</p>
        {(
          [
            ["noHiddenDefects", "No hidden defects"],
            ["noWaterDamage", "No water damage / infiltration"],
            ["noStructuralIssues", "No structural issues"],
            ["noPestInfestation", "No pest infestation"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex flex-wrap items-center gap-4">
            <span className="min-w-[200px] text-sm text-slate-300">{label}</span>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={key}
                  checked={fd.condition?.[key] === true}
                  onChange={() => setCond({ [key]: true })}
                />
                Yes
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={key}
                  checked={fd.condition?.[key] === false}
                  onChange={() => setCond({ [key]: false })}
                />
                No
              </label>
            </div>
          </div>
        ))}
        <label className="block text-sm">
          <span className="text-slate-400">If any issue exists, declare it here</span>
          <textarea
            value={fd.condition?.issuesDetail ?? ""}
            onChange={(e) => setCond({ issuesDetail: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            placeholder="e.g. None, or describe known issues…"
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">4. Work &amp; renovations</h2>
        <label className="block text-sm">
          <span className="text-slate-400">List any renovations done</span>
          <textarea
            value={fd.workRenovations?.renovationsList ?? ""}
            onChange={(e) =>
              patch("workRenovations", { ...fd.workRenovations, renovationsList: e.target.value })
            }
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <div>
          <p className="text-sm text-slate-400">Were permits obtained?</p>
          <TriRadio
            name="permits"
            value={fd.workRenovations?.permitsObtained ?? ""}
            onChange={(v) => patch("workRenovations", { ...fd.workRenovations, permitsObtained: v })}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">5. Legal &amp; financial status</h2>
        <div>
          <p className="text-sm text-slate-400">Any mortgage on property?</p>
          <TriRadio
            name="mortgage"
            value={fd.legalFinancial?.mortgageOnProperty ?? ""}
            onChange={(v) => patch("legalFinancial", { ...fd.legalFinancial, mortgageOnProperty: v })}
          />
        </div>
        <div>
          <p className="text-sm text-slate-400">Any legal issue or lien?</p>
          <TriRadio
            name="lien"
            value={fd.legalFinancial?.legalIssueOrLien ?? ""}
            onChange={(v) => patch("legalFinancial", { ...fd.legalFinancial, legalIssueOrLien: v })}
          />
        </div>
        <label className="block text-sm">
          <span className="text-slate-400">If yes, explain</span>
          <textarea
            value={fd.legalFinancial?.explain ?? ""}
            onChange={(e) => patch("legalFinancial", { ...fd.legalFinancial, explain: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">6. Inclusions / exclusions</h2>
        <label className="block text-sm">
          <span className="text-slate-400">Included in sale</span>
          <textarea
            value={fd.inclusionsExclusions?.included ?? ""}
            onChange={(e) => patch("inclusionsExclusions", { ...fd.inclusionsExclusions, included: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Excluded</span>
          <textarea
            value={fd.inclusionsExclusions?.excluded ?? ""}
            onChange={(e) => patch("inclusionsExclusions", { ...fd.inclusionsExclusions, excluded: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">7. Services &amp; conditions</h2>
        <label className="block text-sm">
          <span className="text-slate-400">Utilities (electricity, water, etc.)</span>
          <textarea
            value={fd.services?.utilities ?? ""}
            onChange={(e) => patch("services", { ...fd.services, utilities: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Condo fees (if applicable)</span>
          <textarea
            value={fd.services?.condoFees ?? ""}
            onChange={(e) => patch("services", { ...fd.services, condoFees: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Taxes</span>
          <textarea
            value={fd.services?.taxes ?? ""}
            onChange={(e) => patch("services", { ...fd.services, taxes: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">8. Declaration</h2>
        <p className="text-sm text-slate-400">I confirm that:</p>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(fd.declaration?.informationTrue)}
            onChange={(e) => patch("declaration", { ...fd.declaration, informationTrue: e.target.checked })}
          />
          All information is true
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(fd.declaration?.nothingHidden)}
            onChange={(e) => patch("declaration", { ...fd.declaration, nothingHidden: e.target.checked })}
          />
          Nothing has been intentionally hidden
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(fd.declaration?.understandsLiability)}
            onChange={(e) => patch("declaration", { ...fd.declaration, understandsLiability: e.target.checked })}
          />
          I understand that false declaration may result in legal liability
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">9. Signature</h2>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(fd.signature?.agreed)}
            onChange={(e) => patch("signature", { ...fd.signature, agreed: e.target.checked })}
          />
          I agree and sign this declaration (electronic)
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Type your full name (signature)</span>
          <input
            value={fd.signature?.typedName ?? ""}
            onChange={(e) => patch("signature", { ...fd.signature, typedName: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            placeholder="Full legal name"
          />
        </label>
        <p className="text-xs text-slate-500">
          Date: submitted time is recorded automatically when you submit.
        </p>
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Submit declaration"}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={loading || declineLoading}
          className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          {declineLoading ? "Saving…" : "I decline"}
        </button>
        <Link
          href={`/bnhub/host/listings/${listingId}/edit`}
          className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
