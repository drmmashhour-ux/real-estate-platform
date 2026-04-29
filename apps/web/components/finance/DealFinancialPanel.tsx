import Link from "next/link";
import type { CommissionStatus } from "@/types/tenancy-finance-enums-client";
import { CommissionSplitTable } from "@/components/finance/CommissionSplitTable";

export type DealFinancialPanelData = {
  id: string;
  salePrice: number | null;
  commissionRate: number | null;
  grossCommission: number | null;
  netCommission: number | null;
  currency: string;
  splits: {
    id: string;
    roleLabel: string | null;
    percent: number | null;
    amount: number | null;
    status: CommissionStatus;
  }[];
};

export type LinkedInvoiceSummary = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
};

/**
 * Offer / deal context: links CRM workflow to tenant finance records.
 */
export function DealFinancialPanel(props: {
  contextLabel: string;
  financeHomeHref: string;
  dealFinancial: DealFinancialPanelData | null;
  invoices: LinkedInvoiceSummary[];
}) {
  const { dealFinancial, invoices } = props;

  return (
    <section className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-sm text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-emerald-200">{props.contextLabel}</h2>
        <Link href={props.financeHomeHref} className="text-xs text-emerald-400 hover:underline">
          Open finance workspace →
        </Link>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Tracked revenue for this workspace — internal workflow unless payment integration is enabled.
      </p>

      {!dealFinancial && invoices.length === 0 ? (
        <p className="mt-3 text-slate-500">
          No deal financials or invoices linked yet. Add them from{" "}
          <Link href="/dashboard/finance/commissions" className="text-emerald-400 hover:underline">
            Finance → Commissions
          </Link>{" "}
          or the finance API.
        </p>
      ) : null}

      {dealFinancial ? (
        <div className="mt-4 space-y-3">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Sale price</dt>
              <dd>{dealFinancial.salePrice != null ? dealFinancial.salePrice.toLocaleString() : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Commission rate</dt>
              <dd>
                {dealFinancial.commissionRate != null
                  ? `${(dealFinancial.commissionRate * 100).toFixed(2)}%`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Gross commission</dt>
              <dd>
                {dealFinancial.grossCommission != null
                  ? `${dealFinancial.grossCommission.toFixed(2)} ${dealFinancial.currency}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Net commission</dt>
              <dd>
                {dealFinancial.netCommission != null
                  ? `${dealFinancial.netCommission.toFixed(2)} ${dealFinancial.currency}`
                  : "—"}
              </dd>
            </div>
          </dl>
          {dealFinancial.splits.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium text-slate-400">Split summary</p>
              <CommissionSplitTable
                splits={dealFinancial.splits.map((s) => ({
                  id: s.id,
                  roleLabel: s.roleLabel,
                  percent: s.percent,
                  amount: s.amount,
                  status: s.status,
                }))}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {invoices.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-400">Linked invoices</p>
          <ul className="space-y-1">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <Link href={`/dashboard/finance/invoices/${inv.id}`} className="text-emerald-400 hover:underline">
                  {inv.invoiceNumber}
                </Link>
                <span className="text-slate-500">
                  {" "}
                  · {inv.status} · {inv.totalAmount.toFixed(2)} {inv.currency}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
