"use client";

import type { OfferScenarioInput } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";

export type OfferDraft = {
  offerRatio: number;
  /** Share of offer; null = omit deposit in model */
  depositRatio: number | null;
  financingCondition: boolean;
  inspectionCondition: boolean;
  documentReviewCondition: boolean;
  occupancyDate: string | null;
  signatureDate: string | null;
  userStrategyMode: string | null;
};

export function defaultOfferDraft(): OfferDraft {
  return {
    offerRatio: 1,
    depositRatio: 0.05,
    financingCondition: true,
    inspectionCondition: true,
    documentReviewCondition: true,
    occupancyDate: null,
    signatureDate: null,
    userStrategyMode: null,
  };
}

export function inputToDraft(input: OfferScenarioInput, listPriceCents: number): OfferDraft {
  return {
    offerRatio: input.offerPriceCents / Math.max(1, listPriceCents),
    depositRatio:
      input.depositAmountCents == null ? null : input.depositAmountCents / Math.max(1, input.offerPriceCents),
    financingCondition: input.financingCondition,
    inspectionCondition: input.inspectionCondition,
    documentReviewCondition: input.documentReviewCondition,
    occupancyDate: input.occupancyDate,
    signatureDate: input.signatureDate,
    userStrategyMode: input.userStrategyMode,
  };
}

export function draftToInput(propertyId: string, listPriceCents: number, d: OfferDraft) {
  const offerPriceCents = Math.max(1, Math.round(listPriceCents * d.offerRatio));
  const depositAmountCents =
    d.depositRatio == null ? null : Math.max(0, Math.round(offerPriceCents * d.depositRatio));
  return {
    propertyId,
    offerPriceCents,
    depositAmountCents,
    financingCondition: d.financingCondition,
    inspectionCondition: d.inspectionCondition,
    documentReviewCondition: d.documentReviewCondition,
    occupancyDate: d.occupancyDate,
    signatureDate: d.signatureDate,
    userStrategyMode: d.userStrategyMode,
  };
}

type Props = {
  listPriceCents: number;
  draft: OfferDraft;
  onChange: (next: OfferDraft) => void;
  idPrefix?: string;
  /** Client-facing copy: shorter labels, hide internal-only fields. */
  presentationMode?: boolean;
};

export function OfferScenarioInputs({
  listPriceCents,
  draft,
  onChange,
  idPrefix = "os",
  presentationMode,
}: Props) {
  const offerDollars = (listPriceCents * draft.offerRatio) / 100;
  const depLabel =
    draft.depositRatio == null ? "None" : `${Math.round(draft.depositRatio * 100)}% of offer`;

  return (
    <div className="space-y-4 text-sm text-slate-200">
      <div>
        <div className="flex justify-between text-xs text-slate-500">
          <label htmlFor={`${idPrefix}-offer`}>{presentationMode ? "Offer amount" : "Offer vs list (illustration)"}</label>
          <span className="tabular-nums text-[#C9A646]">
            ${offerDollars.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <input
          id={`${idPrefix}-offer`}
          type="range"
          min={0.85}
          max={1.08}
          step={0.005}
          value={draft.offerRatio}
          onChange={(e) => onChange({ ...draft, offerRatio: Number(e.target.value) })}
          className="mt-2 w-full accent-[#C9A646]"
        />
        <p className="mt-1 text-[11px] text-slate-500">
          {presentationMode
            ? "Based on the list price on file — not an appraisal."
            : "Uses the listing price on file — not an appraisal or market value."}
        </p>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-500">
          <label htmlFor={`${idPrefix}-dep`}>Deposit (of offer)</label>
          <span>{depLabel}</span>
        </div>
        <input
          id={`${idPrefix}-dep`}
          type="range"
          min={0}
          max={0.2}
          step={0.005}
          value={draft.depositRatio ?? 0}
          disabled={draft.depositRatio === null}
          onChange={(e) => onChange({ ...draft, depositRatio: Number(e.target.value) })}
          className="mt-2 w-full accent-[#C9A646] disabled:opacity-40"
        />
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={draft.depositRatio === null}
            onChange={(e) =>
              onChange({
                ...draft,
                depositRatio: e.target.checked ? null : 0.05,
              })
            }
          />
          {presentationMode ? "Skip deposit for now" : "Omit deposit from this illustration"}
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["financingCondition", "Financing condition"],
            ["inspectionCondition", "Inspection condition"],
            ["documentReviewCondition", "Document review"],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-[#121212] px-3 py-2 text-xs"
          >
            <input
              type="checkbox"
              checked={draft[key]}
              onChange={(e) => onChange({ ...draft, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-slate-500" htmlFor={`${idPrefix}-occ`}>
            Occupancy date (optional)
          </label>
          <input
            id={`${idPrefix}-occ`}
            type="date"
            value={draft.occupancyDate ?? ""}
            onChange={(e) =>
              onChange({ ...draft, occupancyDate: e.target.value ? e.target.value : null })
            }
            className="mt-1 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500" htmlFor={`${idPrefix}-sig`}>
            Signature date (optional)
          </label>
          <input
            id={`${idPrefix}-sig`}
            type="date"
            value={draft.signatureDate ?? ""}
            onChange={(e) =>
              onChange({ ...draft, signatureDate: e.target.value ? e.target.value : null })
            }
            className="mt-1 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      {!presentationMode ? (
        <div>
          <label className="text-xs text-slate-500" htmlFor={`${idPrefix}-mode`}>
            Strategy hint (optional, free text)
          </label>
          <input
            id={`${idPrefix}-mode`}
            type="text"
            value={draft.userStrategyMode ?? ""}
            placeholder="e.g. buy_to_live, invest"
            onChange={(e) => onChange({ ...draft, userStrategyMode: e.target.value || null })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder:text-slate-600"
          />
        </div>
      ) : null}
    </div>
  );
}
