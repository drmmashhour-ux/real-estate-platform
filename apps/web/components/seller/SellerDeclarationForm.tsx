"use client";

import { useCallback, useId, useMemo, useState, type ReactNode } from "react";
import {
  declarationCompletionPercent,
  emptyParty,
  emptyStructuredAddress,
  getSellerDeclarationSectionUiStatus,
  missingDeclarationSections,
  syncSellerFullNameFromParties,
  type DeclarationSectionId,
  type DeclarationUiStatus,
  type SellerDeclarationData,
} from "@/lib/fsbo/seller-declaration-schema";
import { SELLER_DECLARATION_HELP } from "@/lib/fsbo/seller-declaration-help";
import { ExplainSectionButton, SellerChecklistIndex } from "@/components/seller/SellerChecklistIndex";
import { PartyIdentityFields } from "@/components/seller/PartyIdentityFields";
import { DsDsdRegulatoryNotice } from "@/components/seller/DsDsdRegulatoryNotice";
import { AdditionalDeclarationsFields } from "@/components/seller/AdditionalDeclarationsFields";
import { SellerDeclarationAiReviewPanel } from "@/components/seller/SellerDeclarationAiReviewPanel";
import { ListingAiScoresCard } from "@/components/seller/ListingAiScoresCard";
import { SellerDeclarationReadiness } from "@/components/legal/SellerDeclarationReadiness";
import { DECLARATION_SECTION_LABELS } from "@/components/seller/SellerChecklistIndex";
import type { SellerDeclarationAiReview } from "@/lib/fsbo/seller-declaration-ai-review";
import type { ListingAiScoresResult } from "@/lib/fsbo/listing-ai-scores";
import {
  validateSellerDeclarationIntegrity,
  needsSharedContactResponsibilityAck,
  normalizePhoneDigits,
  normalizeEmail,
  sellerSharesPhoneWithAnother,
  sellerSharesEmailWithAnother,
  validateStructuredAddressVsPropertyType,
} from "@/lib/fsbo/seller-declaration-validation";

function statusLabel(s: DeclarationUiStatus): { text: string; className: string } {
  switch (s) {
    case "COMPLETED":
      return { text: "Complete ✓", className: "text-emerald-400" };
    case "IN_PROGRESS":
      return { text: "In progress", className: "text-amber-300" };
    case "NA":
      return { text: "N/A", className: "text-slate-500" };
    default:
      return { text: "Not started", className: "text-slate-500" };
  }
}

function CollapsibleSection({
  id,
  title,
  uiStatus,
  open,
  onToggle,
  children,
  onShowHelp,
}: {
  id: DeclarationSectionId;
  title: string;
  uiStatus: DeclarationUiStatus;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  onShowHelp: (content: (typeof SELLER_DECLARATION_HELP)[DeclarationSectionId]) => void;
}) {
  const chip = statusLabel(uiStatus);
  return (
    <section id={`decl-section-${id}`} className="scroll-mt-24 overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <div className="flex flex-wrap items-stretch gap-2 border-b border-white/5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.04]"
        >
          <span className="text-sm font-semibold text-white">{title}</span>
          <span className={`shrink-0 text-xs font-medium ${chip.className}`}>{chip.text}</span>
        </button>
        <div className="flex items-center gap-2 pr-3">
          <ExplainSectionButton sectionId={id} onShow={onShowHelp} />
        </div>
      </div>
      {open ? <div className="p-4">{children}</div> : null}
    </section>
  );
}

export function SellerDeclarationForm({
  value,
  onChange,
  annualTaxesCents,
  priceCents,
  propertyType,
  listingId = null,
  declarationAiReview = null,
  listingAiScores = null,
  showTrustGraphDeclarationWidget = false,
  trustGraphEngineMetrics = null,
}: {
  value: SellerDeclarationData;
  onChange: (next: SellerDeclarationData) => void;
  annualTaxesCents: number | null;
  priceCents: number;
  propertyType: string;
  /** Required for party ID document upload (Supabase / local). */
  listingId?: string | null;
  /** Last rules-based declaration review (informational; never blocks saves). */
  declarationAiReview?: SellerDeclarationAiReview | null;
  listingAiScores?: ListingAiScoresResult | null;
  /** TrustGraph seller declaration readiness (requires TRUSTGRAPH_DECLARATION_WIDGET_ENABLED + master). */
  showTrustGraphDeclarationWidget?: boolean;
  /** Optional safe engine metrics from hub PATCH `trustGraph.declarationReadiness`. */
  trustGraphEngineMetrics?: {
    contradictionCount: number;
    blockingIssuesCount: number;
  } | null;
}) {
  const modalTitleId = useId();
  const [help, setHelp] = useState<(typeof SELLER_DECLARATION_HELP)[DeclarationSectionId] | null>(null);
  const [openSection, setOpenSection] = useState<DeclarationSectionId | null>("identity");

  const ui = getSellerDeclarationSectionUiStatus(value, propertyType);

  const validation = useMemo(
    () =>
      validateSellerDeclarationIntegrity(
        {
          ...value,
          propertyAddressStructured: value.propertyAddressStructured ?? {
            street: "",
            unit: "",
            city: "",
            postalCode: "",
          },
          sharedContactResponsibilityConfirmed: Boolean(value.sharedContactResponsibilityConfirmed),
        },
        propertyType
      ),
    [value, propertyType]
  );

  const fieldErrors = validation.fieldErrors;

  const addressVsType = useMemo(
    () => validateStructuredAddressVsPropertyType(propertyType, value.propertyAddressStructured),
    [propertyType, value.propertyAddressStructured]
  );

  const patch = useCallback(
    (partial: Partial<SellerDeclarationData>) => {
      onChange(syncSellerFullNameFromParties({ ...value, ...partial }));
    },
    [onChange, value]
  );

  const roughWelcome = priceCents > 0 ? Math.round((priceCents / 100) * 0.015) : null;

  const isCondoType = propertyType === "CONDO";

  const trustGraphReadiness = useMemo(() => {
    const pct = declarationCompletionPercent(value, propertyType);
    const missing = missingDeclarationSections(value, propertyType);
    const blockingIssues = missing.map((id) => DECLARATION_SECTION_LABELS[id]);
    const first: DeclarationSectionId = missing[0] ?? "identity";
    return {
      pct,
      blockingIssues,
      readinessLabel:
        missing.length === 0
          ? "All required sections are complete."
          : "Complete the remaining sections to improve verification readiness.",
      fixHref: `#decl-section-${first}`,
    };
  }, [value, propertyType]);

  function openSectionAndScroll(id: DeclarationSectionId) {
    setOpenSection(id);
    queueMicrotask(() => {
      document.getElementById(`decl-section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="space-y-6">
      {showTrustGraphDeclarationWidget ? (
        <SellerDeclarationReadiness
          completionPercent={trustGraphReadiness.pct}
          blockingIssues={trustGraphReadiness.blockingIssues}
          readinessLabel={trustGraphReadiness.readinessLabel}
          fixHref={trustGraphReadiness.fixHref}
          contradictionCount={trustGraphEngineMetrics?.contradictionCount ?? 0}
          engineFailedRuleCount={trustGraphEngineMetrics?.blockingIssuesCount}
        />
      ) : null}
      <SellerChecklistIndex
        declaration={value}
        propertyType={propertyType}
        onJumpToSection={(id) => {
          openSectionAndScroll(id);
        }}
      />

      <p className="text-xs text-amber-200/90">
        Required seller declaration — structured for transparency (OACIQ-style disclosure). This is not legal advice;
        consult a notary or lawyer for your situation.
      </p>

      <DsDsdRegulatoryNotice />

      <SellerDeclarationAiReviewPanel review={declarationAiReview ?? null} />

      <ListingAiScoresCard scores={listingAiScores ?? null} />

      <CollapsibleSection
        id="identity"
        title="1. Seller identity & authority"
        uiStatus={ui.identity}
        open={openSection === "identity"}
        onToggle={() => setOpenSection((s) => (s === "identity" ? null : "identity"))}
        onShowHelp={setHelp}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Add each seller on title. ID upload is stored securely; verification may be pending until reviewed.
          </p>

          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C9A646]">Property address (civic)</p>
            <p className="mt-1 text-xs text-slate-500">
              Must match your listing property type (e.g. condo usually has a unit number). Canadian postal code format
              (e.g. H2X 1Y1).
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-slate-300 sm:col-span-2">
                Street number &amp; name
                <input
                  value={value.propertyAddressStructured?.street ?? ""}
                  onChange={(e) =>
                    patch({
                      propertyAddressStructured: {
                        ...(value.propertyAddressStructured ?? { street: "", unit: "", city: "", postalCode: "" }),
                        street: e.target.value,
                      },
                    })
                  }
                  className={`mt-1 w-full rounded-lg border bg-black/50 px-3 py-2 text-white ${
                    fieldErrors["propertyAddressStructured.street"] ? "border-red-500/60" : "border-white/10"
                  }`}
                />
                {fieldErrors["propertyAddressStructured.street"] ? (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors["propertyAddressStructured.street"]}</p>
                ) : null}
              </label>
              <label className="block text-sm text-slate-300">
                Unit / apt (optional)
                <input
                  value={value.propertyAddressStructured?.unit ?? ""}
                  onChange={(e) =>
                    patch({
                      propertyAddressStructured: {
                        ...(value.propertyAddressStructured ?? { street: "", unit: "", city: "", postalCode: "" }),
                        unit: e.target.value,
                      },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
                />
              </label>
              <label className="block text-sm text-slate-300">
                City
                <input
                  value={value.propertyAddressStructured?.city ?? ""}
                  onChange={(e) =>
                    patch({
                      propertyAddressStructured: {
                        ...(value.propertyAddressStructured ?? { street: "", unit: "", city: "", postalCode: "" }),
                        city: e.target.value,
                      },
                    })
                  }
                  className={`mt-1 w-full rounded-lg border bg-black/50 px-3 py-2 text-white ${
                    fieldErrors["propertyAddressStructured.city"] ? "border-red-500/60" : "border-white/10"
                  }`}
                />
                {fieldErrors["propertyAddressStructured.city"] ? (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors["propertyAddressStructured.city"]}</p>
                ) : null}
              </label>
              <label className="block text-sm text-slate-300 sm:col-span-2">
                Postal code
                <input
                  value={value.propertyAddressStructured?.postalCode ?? ""}
                  onChange={(e) =>
                    patch({
                      propertyAddressStructured: {
                        ...(value.propertyAddressStructured ?? { street: "", unit: "", city: "", postalCode: "" }),
                        postalCode: e.target.value.toUpperCase(),
                      },
                    })
                  }
                  placeholder="A1A 1A1"
                  className={`mt-1 w-full rounded-lg border bg-black/50 px-3 py-2 text-white ${
                    fieldErrors["propertyAddressStructured.postalCode"] ? "border-red-500/60" : "border-white/10"
                  }`}
                />
                {fieldErrors["propertyAddressStructured.postalCode"] ? (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors["propertyAddressStructured.postalCode"]}</p>
                ) : null}
              </label>
            </div>
            {addressVsType.warnings.length > 0 ? (
              <p className="mt-3 text-xs text-amber-200/90">{addressVsType.warnings[0]}</p>
            ) : null}
          </div>

          {validation.verifyPrompts.length > 0 ? (
            <div className="rounded-lg border border-amber-500/35 bg-amber-950/25 px-3 py-2 text-xs text-amber-100/95">
              <p className="font-medium text-amber-50">Please verify your information</p>
              <ul className="mt-1 list-inside list-disc text-amber-100/90">
                {validation.verifyPrompts.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {value.sellers.map((s, i) => (
            <div key={s.id} className="rounded-lg border border-white/10 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-slate-300">Seller {i + 1}</span>
                {value.sellers.length > 1 ? (
                  <button
                    type="button"
                    className="text-xs text-red-400 hover:underline"
                    onClick={() => {
                      const next = value.sellers.filter((x) => x.id !== s.id);
                      patch({ sellers: next.length ? next : [emptyParty()] });
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <PartyIdentityFields
                label={`Seller ${i + 1}`}
                party={s}
                listingId={listingId}
                fieldErrors={{
                  idNumber: fieldErrors[`sellers.${i}.idNumber`],
                  phone: fieldErrors[`sellers.${i}.phone`],
                  email: fieldErrors[`sellers.${i}.email`],
                }}
                phoneDuplicateConflict={(() => {
                  if (!sellerSharesPhoneWithAnother(value.sellers, i)) return false;
                  const d = normalizePhoneDigits(value.sellers[i]?.phone ?? "");
                  const idx = value.sellers
                    .map((x, j) => (normalizePhoneDigits(x.phone ?? "") === d ? j : -1))
                    .filter((j) => j >= 0);
                  return !idx.every((j) => value.sellers[j]?.sharedContact);
                })()}
                emailDuplicateConflict={(() => {
                  if (!sellerSharesEmailWithAnother(value.sellers, i)) return false;
                  const e = normalizeEmail(value.sellers[i]?.email ?? "");
                  const idx = value.sellers
                    .map((x, j) => (normalizeEmail(x.email ?? "") === e ? j : -1))
                    .filter((j) => j >= 0);
                  return !idx.every((j) => value.sellers[j]?.sharedContact);
                })()}
                onConfirmSharedPhone={() => {
                  const d = normalizePhoneDigits(value.sellers[i]?.phone ?? "");
                  patch({
                    sellers: value.sellers.map((x) =>
                      normalizePhoneDigits(x.phone ?? "") === d ? { ...x, sharedContact: true } : x
                    ),
                  });
                }}
                onConfirmSharedEmail={() => {
                  const e = normalizeEmail(value.sellers[i]?.email ?? "");
                  patch({
                    sellers: value.sellers.map((x) =>
                      normalizeEmail(x.email ?? "") === e ? { ...x, sharedContact: true } : x
                    ),
                  });
                }}
                onChange={(next) => {
                  const sellers = [...value.sellers];
                  sellers[i] = next;
                  patch({ sellers });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => patch({ sellers: [...value.sellers, emptyParty()] })}
            className="rounded-lg border border-dashed border-[#C9A646]/50 px-4 py-2 text-sm font-medium text-[#C9A646] hover:bg-[#C9A646]/10"
          >
            + Add another seller
          </button>

          {needsSharedContactResponsibilityAck({
            ...(value as SellerDeclarationData),
            propertyAddressStructured: value.propertyAddressStructured ?? emptyStructuredAddress(),
            sharedContactResponsibilityConfirmed: Boolean(value.sharedContactResponsibilityConfirmed),
          }) ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-50/95">
              <input
                type="checkbox"
                checked={value.sharedContactResponsibilityConfirmed ?? false}
                onChange={(e) => patch({ sharedContactResponsibilityConfirmed: e.target.checked })}
                className="mt-1 rounded border-white/20"
              />
              <span>
                I confirm that shared phone or email between multiple sellers is intentional and accurate.
                {fieldErrors["sharedContactResponsibilityConfirmed"] ? (
                  <span className="mt-1 block text-xs text-red-400">
                    {fieldErrors["sharedContactResponsibilityConfirmed"]}
                  </span>
                ) : null}
              </span>
            </label>
          ) : null}

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Known buyers (optional)</p>
          <p className="text-xs text-slate-500">
            If the buyer is already known, add identity details for each buyer party. Leave empty if not applicable.
          </p>
          {value.buyers.map((b, i) => (
            <div key={b.id} className="rounded-lg border border-white/10 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-slate-300">Buyer {i + 1}</span>
                <button
                  type="button"
                  className="text-xs text-red-400 hover:underline"
                  onClick={() => {
                    patch({ buyers: value.buyers.filter((x) => x.id !== b.id) });
                  }}
                >
                  Remove
                </button>
              </div>
              <PartyIdentityFields
                label={`Buyer ${i + 1}`}
                party={b}
                listingId={listingId}
                onChange={(next) => {
                  const buyers = [...value.buyers];
                  buyers[i] = next;
                  patch({ buyers });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => patch({ buyers: [...value.buyers, emptyParty()] })}
            className="rounded-lg border border-dashed border-white/20 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            + Add buyer identity
          </button>

          <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={value.hasAuthorityToSell}
              onChange={(e) => patch({ hasAuthorityToSell: e.target.checked })}
              className={`rounded border-white/20 ${fieldErrors["hasAuthorityToSell"] ? "ring-1 ring-red-500/60" : ""}`}
            />
            I have the legal authority to sell this property (owner or authorized representative).
          </label>
          {fieldErrors["hasAuthorityToSell"] ? (
            <p className="mt-1 text-xs text-red-400">{fieldErrors["hasAuthorityToSell"]}</p>
          ) : null}
          <label className="mt-3 block text-sm text-slate-300">
            Notes (authority, co-owners, mandate, etc.)
            <textarea
              value={value.identityNotes}
              onChange={(e) => patch({ identityNotes: e.target.value })}
              rows={2}
              className={`mt-1 w-full rounded-lg border bg-black/50 px-3 py-2 text-white ${
                fieldErrors["identityNotes"] ? "border-red-500/60" : "border-white/10"
              }`}
            />
            {fieldErrors["identityNotes"] ? (
              <span className="mt-1 block text-xs text-red-400">{fieldErrors["identityNotes"]}</span>
            ) : null}
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="conflict"
        title="2. Conflict of interest"
        uiStatus={ui.conflict}
        open={openSection === "conflict"}
        onToggle={() => setOpenSection((s) => (s === "conflict" ? null : "conflict"))}
        onShowHelp={setHelp}
      >
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={value.sellingToFamilyMember}
            onChange={(e) => patch({ sellingToFamilyMember: e.target.checked })}
          />
          I am selling (or may sell) to a family member.
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={value.relatedToBuyer}
            onChange={(e) => patch({ relatedToBuyer: e.target.checked })}
          />
          I am related to the buyer or have another interest in the transaction.
        </label>
        <label className="mt-3 flex items-start gap-2 text-sm text-amber-100">
          <input
            type="checkbox"
            checked={value.conflictInterestDisclosureConfirmed}
            onChange={(e) => patch({ conflictInterestDisclosureConfirmed: e.target.checked })}
            className="mt-1"
          />
          I confirm I have disclosed any relationship or interest that could affect this sale.
        </label>
      </CollapsibleSection>

      <CollapsibleSection
        id="description"
        title="3. Property description"
        uiStatus={ui.description}
        open={openSection === "description"}
        onToggle={() => setOpenSection((s) => (s === "description" ? null : "description"))}
        onShowHelp={setHelp}
      >
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={value.propertyDescriptionAccurate}
            onChange={(e) => patch({ propertyDescriptionAccurate: e.target.checked })}
          />
          The listing description fairly reflects what I know about the property.
        </label>
        <label className="mt-3 block text-sm text-slate-300">
          Notes (boundaries, easements, shared elements…)
          <textarea
            value={value.propertyDescriptionNotes}
            onChange={(e) => patch({ propertyDescriptionNotes: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
      </CollapsibleSection>

      <CollapsibleSection
        id="inclusions"
        title="4. Inclusions & exclusions"
        uiStatus={ui.inclusions}
        open={openSection === "inclusions"}
        onToggle={() => setOpenSection((s) => (s === "inclusions" ? null : "inclusions"))}
        onShowHelp={setHelp}
      >
        <p className="mb-2 text-xs text-slate-500">
          Appliances, fixtures, furniture, equipment — be specific to avoid disputes.
        </p>
        <label className="block text-sm text-slate-300">
          Included items
          <textarea
            value={value.includedItems}
            onChange={(e) => patch({ includedItems: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        <label className="mt-3 block text-sm text-slate-300">
          Excluded items
          <textarea
            value={value.excludedItems}
            onChange={(e) => patch({ excludedItems: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
      </CollapsibleSection>

      <CollapsibleSection
        id="condition"
        title="5. Property condition"
        uiStatus={ui.condition}
        open={openSection === "condition"}
        onToggle={() => setOpenSection((s) => (s === "condition" ? null : "condition"))}
        onShowHelp={setHelp}
      >
        <label className="block text-sm text-slate-300">
          Known defects (write &quot;None known&quot; if applicable)
          <textarea
            value={value.knownDefects}
            onChange={(e) => patch({ knownDefects: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        <label className="mt-3 block text-sm text-slate-300">
          Past issues (water, fire, insurance claims…)
          <textarea
            value={value.pastIssues}
            onChange={(e) => patch({ pastIssues: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        <label className="mt-3 block text-sm text-slate-300">
          Structural concerns
          <textarea
            value={value.structuralConcerns}
            onChange={(e) => patch({ structuralConcerns: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
      </CollapsibleSection>

      <CollapsibleSection
        id="renovations"
        title="6. Renovations & invoices"
        uiStatus={ui.renovations}
        open={openSection === "renovations"}
        onToggle={() => setOpenSection((s) => (s === "renovations" ? null : "renovations"))}
        onShowHelp={setHelp}
      >
        <label className="block text-sm text-slate-300">
          List renovations (with years if known)
          <textarea
            value={value.renovationsDetail}
            onChange={(e) => patch({ renovationsDetail: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        <p className="mt-2 text-xs text-slate-500">Invoices available?</p>
        <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-300">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="inv"
              checked={value.renovationInvoicesAvailable === true}
              onChange={() => patch({ renovationInvoicesAvailable: true })}
            />
            Yes
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="inv"
              checked={value.renovationInvoicesAvailable === false}
              onChange={() => patch({ renovationInvoicesAvailable: false })}
            />
            No
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="pool"
        title="7. Swimming pool"
        uiStatus={ui.pool}
        open={openSection === "pool"}
        onToggle={() => setOpenSection((s) => (s === "pool" ? null : "pool"))}
        onShowHelp={setHelp}
      >
        <p className="mb-3 text-xs text-slate-500">Select one option. The checklist stays neutral until you answer.</p>
        <div className="space-y-2 text-sm text-slate-300">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="pool"
              checked={value.poolExists === null}
              onChange={() => patch({ poolExists: null, poolType: "", poolSafetyCompliance: "" })}
            />
            <span className="text-slate-500">Not answered yet</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="pool"
              checked={value.poolExists === false}
              onChange={() => patch({ poolExists: false, poolType: "", poolSafetyCompliance: "" })}
            />
            No pool on the property
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="pool" checked={value.poolExists === true} onChange={() => patch({ poolExists: true })} />
            Yes — there is a pool
          </label>
        </div>
        {value.poolExists === true ? (
          <>
            <label className="mt-3 block text-sm text-slate-300">
              Type (in-ground, above-ground, spa…)
              <input
                value={value.poolType}
                onChange={(e) => patch({ poolType: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-300">
              Safety / compliance (fence, cover, municipal rules…)
              <textarea
                value={value.poolSafetyCompliance}
                onChange={(e) => patch({ poolSafetyCompliance: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
          </>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection
        id="inspection"
        title="8. Inspection acceptance"
        uiStatus={ui.inspection}
        open={openSection === "inspection"}
        onToggle={() => setOpenSection((s) => (s === "inspection" ? null : "inspection"))}
        onShowHelp={setHelp}
      >
        <label className="flex items-start gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={value.buyerInspectionAccepted}
            onChange={(e) => patch({ buyerInspectionAccepted: e.target.checked })}
            className="mt-1"
          />
          I accept that the buyer may conduct inspections, subject to reasonable access and agreement on timing.
        </label>
      </CollapsibleSection>

      <CollapsibleSection
        id="condo"
        title="9. Condo / syndicate (if applicable)"
        uiStatus={ui.condo}
        open={openSection === "condo"}
        onToggle={() => setOpenSection((s) => (s === "condo" ? null : "condo"))}
        onShowHelp={setHelp}
      >
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={value.isCondo}
            onChange={(e) => patch({ isCondo: e.target.checked })}
          />
          This is a condominium / divided co-ownership.
        </label>
        {isCondoType && !value.isCondo ? (
          <p className="mt-2 text-xs text-amber-300">Property type suggests a condo — confirm above.</p>
        ) : null}
        {value.isCondo ? (
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.condoSyndicateDocumentsAvailable}
                onChange={(e) => patch({ condoSyndicateDocumentsAvailable: e.target.checked })}
              />
              Syndicate documents can be provided or obtained (minutes, bylaws).
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.condoFinancialStatementsAvailable}
                onChange={(e) => patch({ condoFinancialStatementsAvailable: e.target.checked })}
              />
              Recent financial statements are available or obtainable.
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.condoRulesReviewed}
                onChange={(e) => patch({ condoRulesReviewed: e.target.checked })}
              />
              I have reviewed (or will provide access to) the co-ownership rules.
            </label>
          </div>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection
        id="newConstruction"
        title="10. New construction / GCR"
        uiStatus={ui.newConstruction}
        open={openSection === "newConstruction"}
        onToggle={() => setOpenSection((s) => (s === "newConstruction" ? null : "newConstruction"))}
        onShowHelp={setHelp}
      >
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={value.isNewConstruction}
            onChange={(e) => patch({ isNewConstruction: e.target.checked })}
          />
          This is a new construction / first sale subject to GCR or similar warranty context.
        </label>
        {value.isNewConstruction ? (
          <>
            <label className="mt-3 block text-sm text-slate-300">
              GCR / warranty details
              <textarea
                value={value.gcrWarrantyDetails}
                onChange={(e) => patch({ gcrWarrantyDetails: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-300">
              Builder name & contact
              <textarea
                value={value.builderNameContact}
                onChange={(e) => patch({ builderNameContact: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
          </>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection
        id="taxes"
        title="11. Taxes & costs"
        uiStatus={ui.taxes}
        open={openSection === "taxes"}
        onToggle={() => setOpenSection((s) => (s === "taxes" ? null : "taxes"))}
        onShowHelp={setHelp}
      >
        <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-slate-300">
          <p>
            <span className="text-slate-500">Annual taxes (from your listing):</span>{" "}
            {annualTaxesCents != null && annualTaxesCents > 0
              ? `$${(annualTaxesCents / 100).toLocaleString("en-CA")} / year (approx.)`
              : "— not set in property details"}
          </p>
          <p className="mt-2">
            <span className="text-slate-500">Welcome tax (transfer) — illustrative only:</span>{" "}
            {roughWelcome != null ? `~$${roughWelcome.toLocaleString("en-CA")} (rough 1.5% illustration; not binding)` : "—"}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            GST/QST may apply to certain sales (e.g. commercial, some new builds). Resale housing is often exempt — confirm
            with a professional.
          </p>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={value.municipalSchoolTaxAcknowledged}
            onChange={(e) => patch({ municipalSchoolTaxAcknowledged: e.target.checked })}
          />
          I acknowledge tax figures must be verified on tax bills and with a notary; estimates here are non-binding.
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={value.gstQstMayApply}
            onChange={(e) => patch({ gstQstMayApply: e.target.checked })}
          />
          GST/QST may apply to this transaction (seek advice if unsure).
        </label>
        <label className="mt-3 block text-sm text-slate-300">
          GST/QST notes (optional)
          <input
            value={value.gstQstNotes}
            onChange={(e) => patch({ gstQstNotes: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
      </CollapsibleSection>

      <CollapsibleSection
        id="additionalDeclarations"
        title="12. Details &amp; additional declarations"
        uiStatus={ui.additionalDeclarations}
        open={openSection === "additionalDeclarations"}
        onToggle={() => setOpenSection((s) => (s === "additionalDeclarations" ? null : "additionalDeclarations"))}
        onShowHelp={setHelp}
      >
        <AdditionalDeclarationsFields value={value} patch={patch} listingId={listingId} />
      </CollapsibleSection>

      <CollapsibleSection
        id="final"
        title="13. Final declaration"
        uiStatus={ui.final}
        open={openSection === "final"}
        onToggle={() => setOpenSection((s) => (s === "final" ? null : "final"))}
        onShowHelp={setHelp}
      >
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-100/95">
          <p>
            The platform is <strong>not</strong> your lawyer, inspector, or notary. Buyers and sellers must verify
            facts independently. Nothing here replaces professional advice.
          </p>
        </div>
        <label className="mt-3 flex items-start gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={value.informationCompleteAndAccurate}
            onChange={(e) => patch({ informationCompleteAndAccurate: e.target.checked })}
            className="mt-1"
          />
          I confirm all information in this declaration is complete and accurate to the best of my knowledge.
        </label>
        <label className="mt-3 flex items-start gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={value.platformNotLawyerOrInspectorAck}
            onChange={(e) => patch({ platformNotLawyerOrInspectorAck: e.target.checked })}
            className="mt-1"
          />
          I understand the platform does not provide legal or inspection services and I will rely on independent
          professionals as needed.
        </label>
      </CollapsibleSection>

      {help ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#121212] p-5 shadow-xl">
            <h4 id={modalTitleId} className="text-lg font-semibold text-white">
              {help.title}
            </h4>
            <p className="mt-2 text-sm text-slate-400">{help.explain}</p>
            <p className="mt-3 text-sm text-slate-300">
              <span className="font-medium text-[#C9A646]">What to fill:</span> {help.whatToFill}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              <span className="font-medium text-slate-400">Example:</span> {help.example}
            </p>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-[#C9A646] py-2.5 text-sm font-semibold text-black"
              onClick={() => setHelp(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
