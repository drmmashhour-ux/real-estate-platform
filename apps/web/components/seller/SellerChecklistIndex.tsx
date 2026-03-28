"use client";

import type { SellerDeclarationData } from "@/lib/fsbo/seller-declaration-schema";
import {
  DECLARATION_SECTION_IDS,
  declarationCompletionPercent,
  declarationSectionCounts,
  getSellerDeclarationSectionUiStatus,
  type DeclarationSectionId,
  type DeclarationUiStatus,
} from "@/lib/fsbo/seller-declaration-schema";
import { SELLER_DECLARATION_HELP } from "@/lib/fsbo/seller-declaration-help";

/** Shared labels for declaration sections (checklist + TrustGraph readiness widget). */
export const DECLARATION_SECTION_LABELS: Record<DeclarationSectionId, string> = {
  identity: "1. Identity & authority",
  conflict: "2. Conflict of interest",
  description: "3. Property description",
  inclusions: "4. Inclusions / exclusions",
  condition: "5. Property condition",
  renovations: "6. Renovations & invoices",
  pool: "7. Swimming pool",
  inspection: "8. Inspection",
  condo: "9. Condo / syndicate",
  newConstruction: "10. New construction / GCR",
  taxes: "11. Taxes & costs",
  additionalDeclarations: "12. Details & additional declarations",
  final: "13. Final declaration",
};

function markForStatus(s: DeclarationUiStatus): { symbol: string; color: string } {
  switch (s) {
    case "COMPLETED":
      return { symbol: "✓", color: "text-emerald-400" };
    case "IN_PROGRESS":
      return { symbol: "◐", color: "text-amber-300" };
    case "NA":
      return { symbol: "—", color: "text-slate-500" };
    default:
      return { symbol: "○", color: "text-slate-500" };
  }
}

export function SellerChecklistIndex({
  declaration,
  onJumpToSection,
  propertyType,
}: {
  declaration: Partial<SellerDeclarationData>;
  onJumpToSection?: (id: DeclarationSectionId) => void;
  /** Listing property type (e.g. CONDO vs SINGLE_FAMILY) for identity/address validation. */
  propertyType?: string | null;
}) {
  const pct = declarationCompletionPercent(declaration, propertyType);
  const { completed, total } = declarationSectionCounts(declaration, propertyType);
  const ui = getSellerDeclarationSectionUiStatus(declaration, propertyType);

  return (
    <div className="rounded-xl border border-premium-gold/30 bg-premium-gold/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-premium-gold">Declaration checklist (OACIQ-style)</p>
        <span className="text-xs font-mono text-slate-400">
          {completed} / {total} · {pct}%
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/40">
        <div className="h-full bg-premium-gold transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-4 grid gap-1.5 text-xs sm:grid-cols-2">
        {DECLARATION_SECTION_IDS.map((id) => {
          const s = ui[id];
          const { symbol, color } = markForStatus(s);
          return (
            <li key={id}>
              <button
                type="button"
                disabled={!onJumpToSection}
                onClick={() => onJumpToSection?.(id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 ${color}`}
              >
                <span className="w-5 shrink-0 text-center font-mono text-[11px]">{symbol}</span>
                <span className="min-w-0">{DECLARATION_SECTION_LABELS[id]}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-slate-500">
        Click a row to open that section. ○ not started · ◐ in progress · ✓ complete · — not applicable. Publishing is
        blocked until every required section is complete.
      </p>
    </div>
  );
}

export function ExplainSectionButton({
  sectionId,
  onShow,
}: {
  sectionId: DeclarationSectionId;
  onShow: (content: (typeof SELLER_DECLARATION_HELP)[DeclarationSectionId]) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onShow(SELLER_DECLARATION_HELP[sectionId]);
      }}
      className="text-xs font-medium text-premium-gold hover:underline"
    >
      Explain this section
    </button>
  );
}
