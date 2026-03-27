import type { AdditionalDeclarationHistoryEntry, SellerDeclarationData } from "@/lib/fsbo/seller-declaration-schema";
import { SELLER_DECLARATION_VERSION, SELLER_DECLARATION_VERSION_LEGACY } from "@/lib/fsbo/seller-declaration-schema";

function isStructuredDeclaration(json: unknown): json is SellerDeclarationData {
  if (json === null || typeof json !== "object") return false;
  const v = (json as Record<string, unknown>).version;
  return v === SELLER_DECLARATION_VERSION || v === SELLER_DECLARATION_VERSION_LEGACY;
}

/**
 * Buyer-facing summary of seller declaration (no legal advice; informational only).
 * After sale (`listingStatus === "SOLD"`), sensitive identity fields are withheld.
 */
export function FsboBuyerDeclarationSummary({
  sellerDeclarationJson,
  sellerDeclarationCompletedAt,
  listingStatus,
}: {
  sellerDeclarationJson: unknown;
  sellerDeclarationCompletedAt: Date | null;
  /** When `SOLD`, ID numbers and similar PII are not shown. */
  listingStatus?: string;
}) {
  if (!sellerDeclarationCompletedAt || !isStructuredDeclaration(sellerDeclarationJson)) {
    return null;
  }

  const d = sellerDeclarationJson as SellerDeclarationData;
  const additionalHist: AdditionalDeclarationHistoryEntry[] = Array.isArray(d.additionalDeclarationsHistory)
    ? d.additionalDeclarationsHistory
    : [];
  const completedAt =
    sellerDeclarationCompletedAt instanceof Date
      ? sellerDeclarationCompletedAt
      : new Date(sellerDeclarationCompletedAt);

  if (listingStatus === "SOLD") {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Seller declaration</p>
        <p className="mt-2 text-sm text-slate-400">
          A seller declaration was filed and verified for this listing on{" "}
          <time dateTime={completedAt.toISOString()}>{completedAt.toLocaleDateString()}</time>.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Identity numbers and document details are no longer shown after the transaction is completed (privacy).
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#121212] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A646]">Seller declaration summary</p>
      <p className="mt-1 text-xs text-slate-500">
        Provided by the seller — verify independently with a notary or inspector. Not legal advice.
      </p>
      <p className="mt-2 text-[11px] text-amber-200/80">
        Seller declarations (unverified — subject to verification). Shown for transparency to buyers, brokers,
        inspectors, and lenders reviewing this listing.
      </p>
      <dl className="mt-4 space-y-3 text-sm text-[#B3B3B3]">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Conflict of interest</dt>
          <dd>
            Family sale: {d.sellingToFamilyMember ? "Disclosed (yes)" : "Not indicated"}
            {" · "}
            Related to buyer: {d.relatedToBuyer ? "Disclosed (yes)" : "Not indicated"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Inclusions</dt>
          <dd className="whitespace-pre-wrap">{d.includedItems}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Exclusions</dt>
          <dd className="whitespace-pre-wrap">{d.excludedItems}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Condition (summary)</dt>
          <dd className="whitespace-pre-wrap">
            <span className="font-medium text-slate-400">Defects:</span> {d.knownDefects.slice(0, 400)}
            {d.knownDefects.length > 400 ? "…" : ""}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Renovations</dt>
          <dd className="whitespace-pre-wrap">{d.renovationsDetail.slice(0, 500)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Pool</dt>
          <dd>
            {d.poolExists === true
              ? `Yes — ${d.poolType || "type not specified"}`
              : d.poolExists === false
                ? "No pool on the property"
                : "Not answered in stored record"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">Inspection</dt>
          <dd>{d.buyerInspectionAccepted ? "Seller accepts buyer inspections (subject to agreement)." : "—"}</dd>
        </div>
        {d.isCondo ? (
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Condominium</dt>
            <dd>
              Syndicate docs: {d.condoSyndicateDocumentsAvailable ? "Indicated available" : "—"} · Financials:{" "}
              {d.condoFinancialStatementsAvailable ? "Indicated available" : "—"}
            </dd>
          </div>
        ) : null}
        {d.isNewConstruction ? (
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">New construction / GCR</dt>
            <dd className="whitespace-pre-wrap">{d.gcrWarrantyDetails.slice(0, 400)}</dd>
          </div>
        ) : null}
      </dl>

      {additionalHist.length > 0 ? (
        <div className="mt-6 border-t border-white/10 pt-5">
          <h3 className="text-sm font-semibold text-slate-200">Details &amp; additional declarations</h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Clarifications and extra disclosures (timestamped updates).{" "}
            <span className="text-amber-200/90">Seller declarations (unverified — subject to verification)</span>
          </p>
          <ul className="mt-4 space-y-4">
            {[...additionalHist].reverse().map((e) => (
              <li key={e.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] text-slate-500">
                  Updated on:{" "}
                  <time dateTime={e.createdAt}>
                    {new Date(e.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{e.text}</p>
                {e.insufficientKnowledge ? (
                  <p className="mt-2 text-xs text-amber-200/85">Seller indicated limited knowledge for some items.</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
