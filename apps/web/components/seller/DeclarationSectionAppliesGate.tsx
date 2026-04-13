"use client";

import {
  DECLARATION_SECTIONS_WITH_APPLICABILITY_GATE,
  effectiveSectionApplies,
  type DeclarationSectionId,
  type SellerDeclarationData,
} from "@/lib/fsbo/seller-declaration-schema";
import { isCondoPropertyType } from "@/lib/fsbo/seller-declaration-validation";

type Props = {
  sectionId: DeclarationSectionId;
  value: SellerDeclarationData;
  patch: (partial: Partial<SellerDeclarationData>) => void;
  propertyType: string;
  onContinueToNext: () => void;
  children: React.ReactNode;
};

export function DeclarationSectionAppliesGate({
  sectionId,
  value,
  patch,
  propertyType,
  onContinueToNext,
  children,
}: Props) {
  if (!DECLARATION_SECTIONS_WITH_APPLICABILITY_GATE.includes(sectionId)) {
    return <>{children}</>;
  }

  const eff = effectiveSectionApplies(value, sectionId, propertyType);
  const condoForced = sectionId === "condo" && isCondoPropertyType(propertyType);

  function applyChoice(applies: boolean) {
    const nextMap: Partial<Record<DeclarationSectionId, boolean>> = { ...value.sectionApplies, [sectionId]: applies };
    const extra: Partial<SellerDeclarationData> = { sectionApplies: nextMap };
    if (!applies) {
      if (sectionId === "pool") {
        Object.assign(extra, { poolExists: false, poolType: "", poolSafetyCompliance: "" });
      }
      if (sectionId === "condo") {
        Object.assign(extra, { isCondo: false });
      }
      if (sectionId === "newConstruction") {
        Object.assign(extra, { isNewConstruction: false, gcrWarrantyDetails: "", builderNameContact: "" });
      }
    }
    patch(extra);
    if (applies === false) {
      queueMicrotask(onContinueToNext);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-black/25 p-3">
        <p className="text-xs font-medium text-slate-200">Does this section apply to your sale?</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Choose <span className="text-slate-300">Yes</span> to complete the questions below, or{" "}
          <span className="text-slate-300">No</span> to skip as not applicable and go to the next section.
        </p>
        <div className="mt-3 flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
            <input
              type="radio"
              name={`section-${sectionId}`}
              checked={eff === true}
              onChange={() => applyChoice(true)}
            />
            Yes
          </label>
          <label
            className={`flex cursor-pointer items-center gap-2 text-sm text-slate-200 ${
              condoForced ? "cursor-not-allowed opacity-40" : ""
            }`}
          >
            <input
              type="radio"
              name={`section-${sectionId}`}
              disabled={condoForced}
              checked={eff === false}
              onChange={() => applyChoice(false)}
            />
            No (not applicable)
          </label>
        </div>
        {condoForced ? (
          <p className="mt-2 text-xs text-amber-200/90">Your listing is a condominium — section 9 must be completed.</p>
        ) : null}
      </div>
      {eff === true ? children : null}
      {eff === false ? (
        <p className="text-xs text-slate-500">Marked as not applicable. Use Continue below to move to the next section.</p>
      ) : null}
      {eff === null ? <p className="text-xs text-amber-200/85">Choose Yes or No to continue.</p> : null}
    </div>
  );
}
