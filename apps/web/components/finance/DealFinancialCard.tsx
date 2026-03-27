export type DealFinancialSummary = {
  id: string;
  salePrice: number | null;
  commissionRate: number | null;
  grossCommission: number | null;
  netCommission: number | null;
  currency: string;
};

export function DealFinancialCard(props: { deal: DealFinancialSummary }) {
  const { deal } = props;
  return (
    <div className="rounded border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deal financials</h3>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Sale price</dt>
          <dd>{deal.salePrice != null ? deal.salePrice.toLocaleString() : "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Commission rate</dt>
          <dd>{deal.commissionRate != null ? `${(deal.commissionRate * 100).toFixed(2)}%` : "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Gross commission</dt>
          <dd>
            {deal.grossCommission != null ? `${deal.grossCommission.toFixed(2)} ${deal.currency}` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Net commission</dt>
          <dd>
            {deal.netCommission != null ? `${deal.netCommission.toFixed(2)} ${deal.currency}` : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
