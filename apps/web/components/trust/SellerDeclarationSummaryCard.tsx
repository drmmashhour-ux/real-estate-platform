import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MissingItemsList, type MissingItemRow } from "@/components/trust/MissingItemsList";

export function SellerDeclarationSummaryCard({
  completionPct,
  missingFields,
  contradictions,
  readinessLabel,
  editHref,
}: {
  completionPct: number;
  missingFields: MissingItemRow[];
  contradictions: MissingItemRow[];
  readinessLabel: string;
  editHref: string;
}) {
  return (
    <Card className="p-5">
      <SectionHeader
        eyebrow="Seller declaration"
        title="Declaration & disclosure"
        subtitle="Completion, gaps, and flags from your saved declaration."
        action={
          <a
            href={editHref}
            className="rounded-full border border-premium-gold/40 bg-premium-gold/10 px-4 py-2 text-xs font-semibold text-premium-gold transition hover:bg-premium-gold/20"
          >
            Edit declaration
          </a>
        }
      />
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-[#A1A1A1]">Completion</span>
          <span className="text-sm font-semibold text-white">{Math.round(completionPct)}%</span>
        </div>
        <ProgressBar value={completionPct} label="Sections complete" accent="gold" />
        <p className="text-xs text-[#A1A1A1]">
          Readiness: <span className="font-medium text-white">{readinessLabel}</span>
        </p>
        {missingFields.length > 0 ? (
          <div>
            <MissingItemsList title="Missing fields" items={missingFields} />
          </div>
        ) : null}
        {contradictions.length > 0 ? (
          <div>
            <MissingItemsList title="Contradictions / flags" items={contradictions} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
