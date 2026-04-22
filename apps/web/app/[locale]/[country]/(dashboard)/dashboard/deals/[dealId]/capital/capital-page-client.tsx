"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Stack = {
  id: string;
  totalPurchasePrice: number;
  equityAmount: number | null;
  debtAmount: number | null;
  loanToValue: number | null;
  debtServiceCoverage: number | null;
} | null;

type Lender = {
  id: string;
  lenderName: string;
  status: string;
};

type OfferRow = {
  id: string;
  lenderName: string;
  offeredAmount: number;
  interestRate: number;
  status: string;
};

type FCond = { id: string; title: string; status: string; isCritical: boolean };

export function CapitalPageClient({
  dealId,
  initialStack,
  initialLenders,
  initialOffers,
  initialFConds,
  initialReadiness,
  offerComparedAt,
  basePath,
}: {
  dealId: string;
  initialStack: Stack;
  initialLenders: Lender[];
  initialOffers: OfferRow[];
  initialFConds: FCond[];
  initialReadiness: { readinessStatus: string; lastEvaluatedAt: Date } | null;
  offerComparedAt: Date | null;
  basePath: string;
}) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [stack] = useState(initialStack);
  const [readiness, setReadiness] = useState(initialReadiness);

  return (
    <div className="space-y-8">
      {err ?
        <p className="text-sm text-destructive">{err}</p>
      : null}

      <section className="border-b pb-4">
        <h2 className="font-medium">Capital stack</h2>
        {stack ?
          <div className="mt-2 space-y-1 font-mono text-xs">
            <div>Purchase: {stack.totalPurchasePrice}</div>
            <div>Equity: {stack.equityAmount ?? "—"} · Debt: {stack.debtAmount ?? "—"}</div>
            <div>
              LTV:{" "}
              {stack.loanToValue != null ?
                `${stack.loanToValue.toFixed(2)}%`
              : "—"}{" "}
              · DSCR: {stack.debtServiceCoverage ?? "—"}
            </div>
          </div>
        : (
          <form
            className="mt-2 flex flex-wrap gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setErr(null);
              const fd = new FormData(e.currentTarget);
              const totalPurchasePrice = Number(fd.get("purchase"));
              const res = await fetch(`/api/deals/${dealId}/capital`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  totalPurchasePrice,
                  debtAmount: fd.get("debt") ? Number(fd.get("debt")) : undefined,
                  equityAmount: fd.get("equity") ? Number(fd.get("equity")) : undefined,
                }),
              });
              if (!res.ok) setErr(await res.text());
              else router.refresh();
            }}
          >
            <input name="purchase" placeholder="Purchase price" className="border px-2 py-1 text-xs" required />
            <input name="equity" placeholder="Equity (opt)" className="border px-2 py-1 text-xs" />
            <input name="debt" placeholder="Debt (opt)" className="border px-2 py-1 text-xs" />
            <button type="submit" className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
              Create stack
            </button>
          </form>
        )}
      </section>

      <section>
        <h2 className="font-medium">Lenders</h2>
        <form
          className="mt-2 flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            const fd = new FormData(e.currentTarget);
            const res = await fetch(`/api/deals/${dealId}/lenders`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                lenderName: String(fd.get("name") ?? ""),
              }),
            });
            if (!res.ok) setErr(await res.text());
            else router.refresh();
          }}
        >
          <input name="name" placeholder="Institution name" className="border px-2 py-1 text-xs" required />
          <button type="submit" className="rounded bg-secondary px-2 py-1 text-xs">
            Add lender
          </button>
        </form>
        <ul className="mt-2 space-y-3 text-xs">
          {initialLenders.map((l) => (
            <li key={l.id} className="border-l pl-2">
              <span className="font-medium">{l.lenderName}</span> · {l.status}
              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={async () => {
                    setErr(null);
                    const res = await fetch(`/api/deals/lenders/${l.id}/package`, { method: "POST" });
                    if (!res.ok) setErr(await res.text());
                    else router.refresh();
                  }}
                >
                  Send package
                </button>
              </div>
              <form
                className="mt-2 flex flex-wrap gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setErr(null);
                  const fd = new FormData(e.currentTarget);
                  const res = await fetch(`/api/deals/lenders/${l.id}/offers`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      offeredAmount: Number(fd.get("amt")),
                      interestRate: Number(fd.get("rate")),
                      termYears: fd.get("term") ? Number(fd.get("term")) : undefined,
                    }),
                  });
                  if (!res.ok) setErr(await res.text());
                  else router.refresh();
                }}
              >
                <input name="amt" placeholder="Amount" className="border px-1 py-0.5 w-24" required />
                <input name="rate" placeholder="Rate %" className="border px-1 py-0.5 w-16" required step="0.01" />
                <input name="term" placeholder="Term yr" className="border px-1 py-0.5 w-14" />
                <button type="submit" className="rounded border px-2 py-0.5">
                  Add offer
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Offers</h2>
        <p className="text-muted-foreground text-xs">
          Compared at: {offerComparedAt ? offerComparedAt.toISOString().slice(0, 16) : "—"}
        </p>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr className="border-b">
              <th className="py-1">Lender</th>
              <th>Amount</th>
              <th>Rate</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {initialOffers.map((o) => (
              <tr key={o.id} className="border-b border-border/50">
                <td className="py-1">{o.lenderName}</td>
                <td>{o.offeredAmount}</td>
                <td>{o.interestRate}%</td>
                <td>{o.status}</td>
                <td>
                  <button
                    type="button"
                    className="underline"
                    disabled={!offerComparedAt || (o.status !== "RECEIVED" && o.status !== "NEGOTIATING")}
                    onClick={async () => {
                      setErr(null);
                      const res = await fetch(`/api/deals/offers/${o.id}/select`, { method: "POST" });
                      if (!res.ok) setErr(await res.text());
                      else router.refresh();
                    }}
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          className="mt-2 rounded border px-2 py-1 text-xs"
          onClick={async () => {
            setErr(null);
            const res = await fetch(`/api/deals/${dealId}/offers/compare`, { method: "POST" });
            if (!res.ok) setErr(await res.text());
            else router.refresh();
          }}
        >
          Compare offers (≥2 RECEIVED/NEGOTIATING)
        </button>
      </section>

      <section>
        <h2 className="font-medium">Financing conditions</h2>
        <ul className="mt-2 space-y-2 text-xs">
          {initialFConds.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2">
              <span>
                {c.title} [{c.status}] {c.isCritical ? "CRIT" : ""}
              </span>
              <button
                type="button"
                className="underline"
                onClick={async () => {
                  setErr(null);
                  const res = await fetch(`/api/deals/financing-conditions/${c.id}/status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "SATISFIED" }),
                  });
                  if (!res.ok) setErr(await res.text());
                  else router.refresh();
                }}
              >
                Satisfy
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Closing readiness</h2>
        <p className="font-mono text-xs">
          Status: {readiness?.readinessStatus ?? "—"} · Last:{" "}
          {readiness?.lastEvaluatedAt ?
            readiness.lastEvaluatedAt.toISOString().slice(0, 16)
          : "—"}
        </p>
        <button
          type="button"
          className="mt-2 rounded border px-2 py-1 text-xs"
          onClick={async () => {
            setErr(null);
            const res = await fetch(`/api/deals/${dealId}/closing-readiness?refresh=1`);
            if (!res.ok) setErr(await res.text());
            else {
              const j = (await res.json()) as { readinessStatus?: string; row?: { readinessStatus: string } };
              setReadiness(
                j.row ?
                  {
                    readinessStatus: j.row.readinessStatus,
                    lastEvaluatedAt: new Date(),
                  }
                : null
              );
            }
          }}
        >
          Re-evaluate
        </button>
      </section>

      <div>
        <a className="text-xs text-muted-foreground underline" href={basePath}>
          ← Back to deal
        </a>
      </div>
    </div>
  );
}
