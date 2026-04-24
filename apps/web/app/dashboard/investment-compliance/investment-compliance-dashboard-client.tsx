"use client";

import * as React from "react";

type Summary = {
  spvIssuers: Array<{
    id: string;
    dealId: string | null;
    legalName: string;
    issuerType: string;
    jurisdiction: string;
    active: boolean;
    counselApprovedRealMode: boolean;
    exemptionPath: string | null;
    dealCode: string | null;
    distributions: Array<{
      id: string;
      exemptionType: string;
      distributionDate: string;
      filingDeadline: string;
      form45106F1Status: string;
      amfFeeAmount: unknown;
    }>;
  }>;
  filingQueue: Array<{
    spvId: string;
    dealId: string | null;
    distributionId: string;
    status: string;
    filingDeadline: string;
    amfFeeAmount: string;
  }>;
  eligibilityQueue: Array<{ dealId: string; investorId: string; spvId: string | null }>;
  disclaimer?: string;
};

export function InvestmentComplianceDashboardClient() {
  const [data, setData] = React.useState<Summary | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setErr(null);
    const r = await fetch("/api/investment-compliance/summary", { credentials: "include" });
    const j = await r.json();
    if (!r.ok) {
      setErr(j.error ?? "Failed to load");
      setData(null);
      return;
    }
    setData({
      spvIssuers: j.spvIssuers ?? [],
      filingQueue: j.filingQueue ?? [],
      eligibilityQueue: j.eligibilityQueue ?? [],
      disclaimer: j.disclaimer,
    });
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 text-sm">
      <div>
        <h1 className="text-xl font-semibold">Investment compliance (AMF private placement)</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl text-xs leading-relaxed">
          SPV issuer shell, prospectus-exempt distribution tracking, and investor eligibility —{" "}
          <strong>separate from brokerage execution</strong>. Subscription signing and capital receipt require a recorded exemption
          path when linked to an SPV. Default mode is simulation-first; enable real mode only with counsel approval.
        </p>
      </div>

      {err ? <p className="rounded border border-red-200 bg-red-50 p-3 text-red-800">{err}</p> : null}
      {data?.disclaimer ?
        <p className="rounded border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950">{data.disclaimer}</p>
      : null}

      <button type="button" className="rounded-md border px-3 py-1.5 text-xs" onClick={() => void load()}>
        Refresh
      </button>

      {!data ?
        <p className="text-muted-foreground text-xs">Loading…</p>
      : <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">SPV issuers</h2>
            {data.spvIssuers.length === 0 ?
              <p className="text-muted-foreground mt-2 text-xs">No SPVs yet — use POST /api/spv/create from ops or integrate deal UI.</p>
            : <ul className="mt-3 space-y-3">
                {data.spvIssuers.map((s) => (
                  <li key={s.id} className="rounded border p-3 text-xs">
                    <p className="font-medium">{s.legalName}</p>
                    <p className="text-muted-foreground font-mono text-[10px]">{s.id}</p>
                    <p className="mt-1">
                      Deal {s.dealCode ?? s.dealId ?? "—"} · Exemption: {s.exemptionPath ?? "—"} · Real mode:{" "}
                      {s.counselApprovedRealMode ? "yes" : "simulation"}
                    </p>
                  </li>
                ))}
              </ul>
            }
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">45-106 filing queue</h2>
            {data.filingQueue.length === 0 ?
              <p className="text-muted-foreground mt-2 text-xs">No open filing tasks.</p>
            : <ul className="mt-3 space-y-2 text-xs">
                {data.filingQueue.map((f) => (
                  <li key={f.distributionId} className="rounded border p-2">
                    <span className="font-medium uppercase">{f.status}</span> · Due {f.filingDeadline.slice(0, 10)} · Fee $
                    {f.amfFeeAmount}
                    <p className="text-muted-foreground font-mono text-[10px]">{f.distributionId}</p>
                  </li>
                ))}
              </ul>
            }
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">Investor eligibility queue</h2>
            {data.eligibilityQueue.length === 0 ?
              <p className="text-muted-foreground mt-2 text-xs">No SPV commitments pending classification.</p>
            : <ul className="mt-3 space-y-2 text-xs">
                {data.eligibilityQueue.map((r) => (
                  <li key={`${r.dealId}-${r.investorId}`} className="rounded border p-2 font-mono text-[11px]">
                    deal {r.dealId.slice(0, 8)}… · investor {r.investorId.slice(0, 8)}… · spv {r.spvId?.slice(0, 8) ?? "—"}…
                  </li>
                ))}
              </ul>
            }
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">AMF fee tracker</h2>
            <p className="text-muted-foreground mt-2 text-xs">
              Minimum fee placeholder: <strong>$353 CAD</strong> per exempt distribution record (verify with AMF / counsel for the
              applicable period). Shown on each distribution row and in broker tasks.
            </p>
          </section>
        </div>
      }
    </div>
  );
}
