import type { MonthlyHostFinanceRow } from "@/lib/bnhub/host-monthly-finance";

function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function HostFinanceBars({ rows }: { rows: MonthlyHostFinanceRow[] }) {
  const hasData = rows.some((r) => r.guestChargedCents > 0);

  return (
    <section className="bnhub-panel mb-8 p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-premium-gold/90">Money flow (completed payments)</h2>
      <p className="mt-2 max-w-3xl text-xs text-neutral-500">
        Each bar is 100% of what guests were charged that month. Gold = your estimated payout; mid tone = platform fee. Same basis admins use for reconciliation.
      </p>
      <div className="mt-6 space-y-5">
        {rows.map((row) => {
          const g = row.guestChargedCents;
          const platPct = g > 0 ? (row.platformCents / g) * 100 : 0;
          const hostPct = g > 0 ? (row.hostCents / g) * 100 : 0;
          const restPct = Math.max(0, 100 - platPct - hostPct);

          return (
            <div key={row.key}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-neutral-300">{row.monthLabel}</span>
                <span className="text-[11px] text-neutral-500">
                  Charged {fmtMoney(row.guestChargedCents)} · Fee {fmtMoney(row.platformCents)} · You{" "}
                  <span className="text-premium-gold">{fmtMoney(row.hostCents)}</span>
                </span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/10">
                {g > 0 ? (
                  <>
                    <div
                      className="bg-premium-gold"
                      style={{ width: `${hostPct}%` }}
                      title={`Host ${fmtMoney(row.hostCents)}`}
                    />
                    <div
                      className="bg-premium-gold/45"
                      style={{ width: `${platPct}%` }}
                      title={`Platform ${fmtMoney(row.platformCents)}`}
                    />
                    {restPct > 0.5 ? (
                      <div
                        className="bg-neutral-600"
                        style={{ width: `${restPct}%` }}
                        title="Other / rounding"
                      />
                    ) : null}
                  </>
                ) : (
                  <div className="h-full w-full bg-neutral-800" title="No completed charges" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!hasData ? (
        <p className="mt-4 text-sm text-neutral-500">No completed payments in this window yet — bars fill as guests check out.</p>
      ) : null}
    </section>
  );
}
