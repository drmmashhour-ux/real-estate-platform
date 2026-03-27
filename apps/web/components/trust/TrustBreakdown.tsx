import { MissingItemsList, type MissingItemRow } from "@/components/trust/MissingItemsList";

export function TrustBreakdown({
  missing,
  warnings,
  passed,
}: {
  missing: MissingItemRow[];
  warnings: MissingItemRow[];
  passed: MissingItemRow[];
}) {
  return (
    <div className="space-y-5">
      <div>
        <MissingItemsList title="Missing items" items={missing} emptyMessage="No critical gaps flagged." />
      </div>
      <div>
        <MissingItemsList title="Warnings" items={warnings} emptyMessage="No warnings." />
      </div>
      <div>
        <MissingItemsList title="Passed checks" items={passed} emptyMessage="Run verification to see completed checks." />
      </div>
    </div>
  );
}
