"use client";

import { useMemo } from "react";
import { DetailDrawer } from "@/components/admin/DetailDrawer";
import { PaymentsTable, type PaymentsTableRow } from "@/components/admin/PaymentsTable";

export type OrchestratedTableSerializedRow = {
  id: string;
  userLabel: string;
  amount: string;
  status: PaymentsTableRow["status"];
  detail: Record<string, unknown>;
};

type Props = {
  rows: OrchestratedTableSerializedRow[];
  emptyMessage?: string;
};

/**
 * Orchestrated payments timeline with premium table + per-row JSON drawer.
 */
export function MonetizationOrchestratedTableClient({ rows, emptyMessage }: Props) {
  const tableRows: PaymentsTableRow[] = useMemo(
    () => rows.map((r) => ({ id: r.id, user: r.userLabel, amount: r.amount, status: r.status })),
    [rows]
  );

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r.detail])), [rows]);

  return (
    <PaymentsTable
      rows={tableRows}
      emptyMessage={emptyMessage}
      renderActions={(r) => (
        <>
          <DetailDrawer data={byId.get(r.id) ?? { id: r.id }} triggerLabel="View" title="Orchestrated payment" />
          <span className="text-white/40">·</span>
          <button type="button" className="text-white/50" disabled title="Refunds via Stripe / support">
            Refund
          </button>
        </>
      )}
    />
  );
}
