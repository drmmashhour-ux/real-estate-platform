"use client";

import { useCallback, useId, useMemo, useState, type ReactNode } from "react";
import { resolveSellerDeclarationVariant } from "@/src/modules/seller-declaration-ai/knowledge/sellerWorkflowPillarRules";
import {
  DECLARATION_SECTION_IDS,
  declarationCompletionPercent,
  emptyParty,
  emptyStructuredAddress,
  getSellerDeclarationSectionUiStatus,
  missingDeclarationSections,
  needsAuthoritySupplementalPath,
  nextDeclarationSectionId,
  syncSellerFullNameFromParties,
  type DeclarationSectionId,
  type DeclarationUiStatus,
  type SellerDeclarationData,
} from "@/lib/fsbo/seller-declaration-schema";
import { DeclarationSectionAppliesGate } from "@/components/seller/DeclarationSectionAppliesGate";
import { SELLER_DECLARATION_HELP } from "@/lib/fsbo/seller-declaration-help";
import { ExplainSectionButton, SellerChecklistIndex } from "@/components/seller/SellerChecklistIndex";
import { AuthoritySupplementalDocs } from "@/components/seller/AuthoritySupplementalDocs";
import { PartyIdentityFields } from "@/components/seller/PartyIdentityFields";
import { DsDsdRegulatoryNotice } from "@/components/seller/DsDsdRegulatoryNotice";
import { AdditionalDeclarationsFields } from "@/components/seller/AdditionalDeclarationsFields";
import { WritingCorrectionLabelRow } from "@/components/ui/WritingCorrectionButton";
import { SellerDeclarationAiReviewPanel } from "@/components/seller/SellerDeclarationAiReviewPanel";
import { SellerTaxesAssistantPanel } from "@/components/seller/SellerTaxesAssistantPanel";
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
  onSectionSave,
  sectionSaveBusy = false,
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
  /** When set, section footer shows Save (e.g. persist declaration draft to listing). */
  onSectionSave?: () => void | Promise<void>;
  sectionSaveBusy?: boolean;
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
  const declarationVariant = useMemo(
    () =>
      resolveSellerDeclarationVariant({
        property_type: propertyType === "CONDO" ? "condo" : propertyType === "TOWNHOUSE" ? "townhouse" : propertyType === "MULTI_FAMILY" ? "plex" : "single_family",
        ownership_type: value.isCondo ? "divided_coownership" : "standard",
        isCondo: value.isCondo,
      }),
    [propertyType, value.isCondo]
  );

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

  function continueToNextSection(fromId: DeclarationSectionId) {
    const n = nextDeclarationSectionId(fromId);
    if (n) openSectionAndScroll(n);
  }

  const sectionOrder = DECLARATION_SECTION_IDS;
  const currentSectionIndex = openSection ? sectionOrder.indexOf(openSection) : 0;
  const safeIdx = currentSectionIndex < 0 ? 0 : currentSectionIndex;
  const canSectionBack = safeIdx > 0;
  const canSectionContinue = safeIdx < sectionOrder.length - 1;

  function goAdjacentSection(delta: -1 | 1) {
    const start = openSection ?? sectionOrder[0];
    let i = sectionOrder.indexOf(start);
    if (i < 0) i = 0;
    const j = Math.min(sectionOrder.length - 1, Math.max(0, i + delta));
    if (j === i && delta !== 0) return;
    const next = sectionOrder[j];
    openSectionAndScroll(next);
  }

  async function handleSectionSave() {
    if (!onSectionSave) return;
    await onSectionSave();
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

      <div className="rounded-xl border border-sky-400/20 bg-sky-500/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white">Declaration path guide</p>
            <p className="text-xs text-slate-300">
              The seller hub now tracks whether this disclosure follows a standard DS-style path or a divided co-ownership DSD-style path.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {declarationVariant ? `Current path: ${declarationVariant}` : "Current path: pending"}
          </span>
        </div>
        <p className="mt-3 text-xs text-slate-300">
          {declarationVariant === "DSD"
            ? "Because this file is being treated as divided co-ownership, section 9 should include syndicate documents, financial statements, contingency-fund details, and any known special assessments."
            : "For standard residential or undivided ownership, the DS-style path applies. If this listing is actually a condo / divided co-ownership, confirm that in section 9."}
        </p>
      </div>

      <DsDsdRegulatoryNotice variant={declarationVariant ?? undefined} />

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
            <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Property address (civic)</p>
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
                  idDetailsConfirmed: fieldErrors[`sellers.${i}.idDetailsConfirmed`],
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
            className="rounded-lg border border-dashed border-premium-gold/50 px-4 py-2 text-sm font-medium text-premium-gold hover:bg-premium-gold/10"
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

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Selling capacity</p>
            <p className="mt-1 text-xs text-slate-500">
              Check all that apply. If any is checked, use the supplemental identification block below (aligned with
              transparency norms in Québec brokerage practice — not legal advice).
            </p>
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={value.authoritySellerIsCompany}
                onChange={(e) => patch({ authoritySellerIsCompany: e.target.checked })}
                className="mt-0.5 rounded border-white/20"
              />
              <span>
                A <strong className="font-medium text-slate-200">company</strong> (legal person) is on title or is signing
                for this sale
              </span>
            </label>
            <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={value.authorityLawyerOrNotary}
                onChange={(e) => patch({ authorityLawyerOrNotary: e.target.checked })}
                className="mt-0.5 rounded border-white/20"
              />
              <span>
                I act as a <strong className="font-medium text-slate-200">lawyer or notary</strong> for the seller(s) in
                this listing
              </span>
            </label>
            <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={value.authorityMandateRepresentative}
                onChange={(e) => patch({ authorityMandateRepresentative: e.target.checked })}
                className="mt-0.5 rounded border-white/20"
              />
              <span>
                I act under a <strong className="font-medium text-slate-200">mandate / power of attorney</strong> and am
                not the registered owner in my own name
              </span>
            </label>
          </div>

          {needsAuthoritySupplementalPath(value) ? (
            <div
              className={`rounded-xl border p-4 ${
                fieldErrors["authoritySupplementalDocs"] ? "border-red-500/40 bg-red-950/15" : "border-premium-gold/35 bg-premium-gold/[0.04]"
              }`}
            >
              <p className="text-sm font-semibold text-premium-gold/95">Enhanced seller identification</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                For listings involving a legal person, a professional acting for sellers, or a non-owner representative,
                the platform asks for PDF or image evidence of your authority (e.g. power of attorney, minute or
                resolution, NEQ or corporate excerpt, Barreau / Chambre des notaires identification). This supports the
                same transparency goals as standard brokerage disclosure rules in Québec (OACIQ-style practice). General
                principles on representation and mandate in the{" "}
                <span className="text-slate-300">Civil Code of Québec</span> apply between parties; confirm scope with
                your notary or counsel — this is not legal advice.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Keep individual government ID for natural-person sellers in the seller rows above; use this section for
                corporate or mandate documents.
              </p>
              <div className="mt-4">
                <AuthoritySupplementalDocs
                  listingId={listingId}
                  docs={value.authoritySupplementalDocs ?? []}
                  onChange={(authoritySupplementalDocs) => patch({ authoritySupplementalDocs })}
                  fieldError={fieldErrors["authoritySupplementalDocs"]}
                />
              </div>
            </div>
          ) : null}

          {needsAuthoritySupplementalPath(value) ? (
            <p className="mt-3 text-xs font-medium text-amber-200/90">
              Authority attestation — required with your selling capacity selection: confirm below and add notes (co-owners,
              mandate, corporate file references, etc.).
            </p>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              If you use a selling capacity option above (company, lawyer/notary, or mandate), you will be asked to confirm
              authority and add notes. For a standard individual owner with none of those checked, these fields are
              optional.
            </p>
          )}

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
            <WritingCorrectionLabelRow
              label="Notes (authority, co-owners, mandate, etc.)"
              textValue={value.identityNotes}
              onApply={(v) => patch({ identityNotes: v })}
            />
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
        <DeclarationSectionAppliesGate
          sectionId="conflict"
          value={value}
          patch={patch}
          propertyType={propertyType}
          onContinueToNext={() => continueToNextSection("conflict")}
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
        </DeclarationSectionAppliesGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="description"
        title="3. Property description"
        uiStatus={ui.description}
        open={openSection === "description"}
        onToggle={() => setOpenSection((s) => (s === "description" ? null : "description"))}
        onShowHelp={setHelp}
      >
        <DeclarationSectionAppliesGate
          sectionId="description"
          value={value}
          patch={patch}
          propertyType={propertyType}
          onContinueToNext={() => continueToNextSection("description")}
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
          <WritingCorrectionLabelRow
            label="Notes (boundaries, easements, shared elements…)"
            textValue={value.propertyDescriptionNotes}
            onApply={(v) => patch({ propertyDescriptionNotes: v })}
          />
          <textarea
            value={value.propertyDescriptionNotes}
            onChange={(e) => patch({ propertyDescriptionNotes: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        </DeclarationSectionAppliesGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="inclusions"
        title="4. Inclusions & exclusions"
        uiStatus={ui.inclusions}
        open={openSection === "inclusions"}
        onToggle={() => setOpenSection((s) => (s === "inclusions" ? null : "inclusions"))}
        onShowHelp={setHelp}
      >
        <DeclarationSectionAppliesGate
          sectionId="inclusions"
          value={value}
          patch={patch}
          propertyType={propertyType}
          onContinueToNext={() => continueToNextSection("inclusions")}
        >
        <p className="mb-2 text-xs text-slate-500">
          Appliances, fixtures, furniture, equipment — be specific to avoid disputes.
        </p>
        <label className="block text-sm text-slate-300">
          <WritingCorrectionLabelRow
            label="Included items"
            textValue={value.includedItems}
            onApply={(v) => patch({ includedItems: v })}
          />
          <textarea
            value={value.includedItems}
            onChange={(e) => patch({ includedItems: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        <label className="mt-3 block text-sm text-slate-300">
          <WritingCorrectionLabelRow
            label="Excluded items"
            textValue={value.excludedItems}
            onApply={(v) => patch({ excludedItems: v })}
          />
          <textarea
            value={value.excludedItems}
            onChange={(e) => patch({ excludedItems: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        </DeclarationSectionAppliesGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="condition"
        title="5. Property condition"
        uiStatus={ui.condition}
        open={openSection === "condition"}
        onToggle={() => setOpenSection((s) => (s === "condition" ? null : "condition"))}
        onShowHelp={setHelp}
      >
        <DeclarationSectionAppliesGate
          sectionId="condition"
          value={value}
          patch={patch}
          propertyType={propertyType}
          onContinueToNext={() => continueToNextSection("condition")}
        >
        <label className="block text-sm text-slate-300">
          <WritingCorrectionLabelRow
            label='Known defects (write "None known" if applicable)'
            textValue={value.knownDefects}
            onApply={(v) => patch({ knownDefects: v })}
          />
          <textarea
            value={value.knownDefects}
            onChange={(e) => patch({ knownDefects: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        <label className="mt-3 block text-sm text-slate-300">
          <WritingCorrectionLabelRow
            label="Past issues (water, fire, insurance claims…)"
            textValue={value.pastIssues}
            onApply={(v) => patch({ pastIssues: v })}
          />
          <textarea
            value={value.pastIssues}
            onChange={(e) => patch({ pastIssues: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        <label className="mt-3 block text-sm text-slate-300">
          <WritingCorrectionLabelRow
            label="Structural concerns"
            textValue={value.structuralConcerns}
            onApply={(v) => patch({ structuralConcerns: v })}
          />
          <textarea
            value={value.structuralConcerns}
            onChange={(e) => patch({ structuralConcerns: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </label>
        </DeclarationSectionAppliesGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="renovations"
        title="6. Renovations & invoices"
        uiStatus={ui.renovations}
        open={openSection === "renovations"}
        onToggle={() => setOpenSection((s) => (s === "renovations" ? null : "renovations"))}
        onShowHelp={setHelp}
      >
        <DeclarationSectionAppliesGate
          sectionId="renovations"
          value={value}
          patch={patch}
          propertyType={propertyType}
          onContinueToNext={() => continueToNextSection("renovations")}
        >
        <label className="block text-sm text-slate-300">
          <WritingCorrectionLabelRow
            label="List renovations (with years if known)"
            textValue={value.renovationsDetail}
            onApply={(v) => patch({ renovationsDetail: v })}
          />
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
        </DeclarationSectionAppliesGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="pool"
        title="7. Swimming pool"
        uiStatus={ui.pool}
        open={openSection === "pool"}
        onToggle={() => setOpenSection((s) => (s === "pool" ? null : "pool"))}
        onShowHelp={setHelp}
      >
        <DeclarationSectionAppliesGate
          sectionId="pool"
          value={value}
          patch={patch}
          propertyType={propertyType}
          onContinueToNext={() => continueToNextSection("pool")}
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
              <WritingCorrectionLabelRow
                label="Safety / compliance (fence, cover, municipal rules…)"
                textValue={value.poolSafetyCompliance}
                onApply={(v) => patch({ poolSafetyCompliance: v })}
              />
              <textarea
                value={value.poolSafetyCompliance}
                onChange={(e) => patch({ poolSafetyCompliance: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
          </>
        ) : null}
        </DeclarationSectionAppliesGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="inspection"
        title="8. Inspection acceptance"
        uiStatus={ui.inspection}
        open={openSection === "inspection"}
        onToggle={() => setOpenSection((s) => (s === "inspection" ? null : "inspection"))}
        onShowHelp={setHelp}
      >
        <DeclarationSectionAppliesGate
          sectionId="inspection"
          value={value}
          patch={patch}
          propertyType={propertyType}
          onContinueToNext={() => continueToNextSection("inspection")}
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
        </DeclarationSectionAppliesGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="condo"
        title="9. Condo / syndicate (if applicable)"
        uiStatus={ui.condo}
        open={openSection === "condo"}
        onToggle={() => setOpenSection((s) => (s === "condo" ? null : "condo"))}
        onShowHelp={setHelp}
      >
        <DeclarationSectionAppliesGate
          sectionId="condo"
          value={value}
          patch={patch}
          propertyType={propertyType}
          onContinueToNext={() => continueToNextSection("condo")}
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
            <div className="rounded-lg border border-premium-gold/20 bg-premium-gold/5 p-3 text-xs text-slate-300">
              DSD-style reminder: buyers usually need co-ownership documents, financial statements, contingency-fund context, and any special assessment information to understand the file properly.
            </div>
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
            <label className="block text-sm text-slate-300">
              <WritingCorrectionLabelRow
                label="Contingency fund / reserve details"
                textValue={value.condoContingencyFundDetails}
                onApply={(v) => patch({ condoContingencyFundDetails: v })}
              />
              <textarea
                value={value.condoContingencyFundDetails}
                onChange={(e) => patch({ condoContingencyFundDetails: e.target.value })}
                rows={3}
                className={`mt-1 w-full rounded-lg border bg-black/50 px-3 py-2 text-white ${
                  fieldErrors.condoContingencyFundDetails ? "border-red-500/60" : "border-white/10"
                }`}
                placeholder="Describe reserve fund context, major planned repairs, or what the seller knows about the contingency fund."
              />
              {fieldErrors.condoContingencyFundDetails ? (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.condoContingencyFundDetails}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Add factual reserve-fund or contingency-fund context, even if the information is incomplete.
                </p>
              )}
            </label>
            <label className="block text-sm text-slate-300">
              <WritingCorrectionLabelRow
                label="Special assessments"
                textValue={value.condoSpecialAssessmentDetails}
                onApply={(v) => patch({ condoSpecialAssessmentDetails: v })}
              />
              <textarea
                value={value.condoSpecialAssessmentDetails}
                onChange={(e) => patch({ condoSpecialAssessmentDetails: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
                placeholder="Describe any known special assessments, timing, amount, or whether none are known."
              />
            </label>
            <label className="block text-sm text-slate-300">
              <WritingCorrectionLabelRow
                label="Common services / rules notes"
                textValue={value.condoCommonServicesNotes}
                onApply={(v) => patch({ condoCommonServicesNotes: v })}
              />
              <textarea
                value={value.condoCommonServicesNotes}
                onChange={(e) => patch({ condoCommonServicesNotes: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
                placeholder="Summarize common services, restrictions, or co-ownership rules relevant to the buyer."
              />
            </label>
          </div>
        ) : null}
        </DeclarationSectionAppliesGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="newConstruction"
        title="10. New construction / GCR"
        uiStatus={ui.newConstruction}
        open={openSection === "newConstruction"}
        onToggle={() => setOpenSection((s) => (s === "newConstruction" ? null : "newConstruction"))}
        onShowHelp={setHelp}
      >
        <DeclarationSectionAppliesGate
          sectionId="newConstruction"
          value={value}
          patch={patch}
          propertyType={propertyType}
          onContinueToNext={() => continueToNextSection("newConstruction")}
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
              <WritingCorrectionLabelRow
                label="GCR / warranty details"
                textValue={value.gcrWarrantyDetails}
                onApply={(v) => patch({ gcrWarrantyDetails: v })}
              />
              <textarea
                value={value.gcrWarrantyDetails}
                onChange={(e) => patch({ gcrWarrantyDetails: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-300">
              <WritingCorrectionLabelRow
                label="Builder name & contact"
                textValue={value.builderNameContact}
                onApply={(v) => patch({ builderNameContact: v })}
              />
              <textarea
                value={value.builderNameContact}
                onChange={(e) => patch({ builderNameContact: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
              />
            </label>
          </>
        ) : null}
        </DeclarationSectionAppliesGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="taxes"
        title="11. Taxes & costs"
        uiStatus={ui.taxes}
        open={openSection === "taxes"}
        onToggle={() => setOpenSection((s) => (s === "taxes" ? null : "taxes"))}
        onShowHelp={setHelp}
      >
        <DeclarationSectionAppliesGate
          sectionId="taxes"
          value={value}
          patch={patch}
          propertyType={propertyType}
          onContinueToNext={() => continueToNextSection("taxes")}
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
        <SellerTaxesAssistantPanel listingId={listingId ?? null} value={value} patch={patch} />
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
        </DeclarationSectionAppliesGate>
      </CollapsibleSection>

      <CollapsibleSection
        id="additionalDeclarations"
        title="12. Details &amp; additional declarations"
        uiStatus={ui.additionalDeclarations}
        open={openSection === "additionalDeclarations"}
        onToggle={() => setOpenSection((s) => (s === "additionalDeclarations" ? null : "additionalDeclarations"))}
        onShowHelp={setHelp}
      >
        <DeclarationSectionAppliesGate
          sectionId="additionalDeclarations"
          value={value}
          patch={patch}
          propertyType={propertyType}
          onContinueToNext={() => continueToNextSection("additionalDeclarations")}
        >
          <AdditionalDeclarationsFields value={value} patch={patch} listingId={listingId} />
        </DeclarationSectionAppliesGate>
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

      <div className="sticky bottom-0 z-20 mt-8 flex flex-wrap items-center gap-2 border-t border-white/10 bg-[#0a0a0a]/95 px-1 py-4 backdrop-blur-sm">
        <button
          type="button"
          disabled={!canSectionBack || sectionSaveBusy}
          onClick={() => goAdjacentSection(-1)}
          className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        {onSectionSave ? (
          <button
            type="button"
            disabled={sectionSaveBusy}
            onClick={() => void handleSectionSave()}
            className="rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-sm font-medium text-premium-gold hover:bg-premium-gold/15 disabled:opacity-50"
          >
            {sectionSaveBusy ? "Saving…" : "Save"}
          </button>
        ) : null}
        <button
          type="button"
          disabled={!canSectionContinue || sectionSaveBusy}
          onClick={() => goAdjacentSection(1)}
          className="rounded-xl bg-premium-gold px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </button>
      </div>
      <p className="text-center text-[11px] text-slate-500">
        Save stores your declaration draft. Continue moves to the next section.
      </p>

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
              <span className="font-medium text-premium-gold">What to fill:</span> {help.whatToFill}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              <span className="font-medium text-slate-400">Example:</span> {help.example}
            </p>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-premium-gold py-2.5 text-sm font-semibold text-black"
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
