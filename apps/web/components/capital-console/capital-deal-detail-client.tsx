"use client";

import * as React from "react";

type Props = { dealId: string };

export function CapitalDealDetailClient({ dealId }: Props) {
  const [stack, setStack] = React.useState<unknown>(null);
  const [pkg, setPkg] = React.useState<unknown>(null);
  const [lenders, setLenders] = React.useState<unknown[]>([]);
  const [offersPayload, setOffersPayload] = React.useState<unknown>(null);
  const [conditions, setConditions] = React.useState<unknown[]>([]);
  const [covenants, setCovenants] = React.useState<unknown[]>([]);
  const [closing, setClosing] = React.useState<unknown>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setMsg(null);
    try {
      const base = `/api/capital/deals/${dealId}`;
      const [s, p, l, o, fc, cov, cr] = await Promise.all([
        fetch(`${base}/stack`, { credentials: "include" }).then((r) => r.json()),
        fetch(`${base}/lender-package`, { credentials: "include" }).then((r) => r.json()),
        fetch(`${base}/lenders`, { credentials: "include" }).then((r) => r.json()),
        fetch(`${base}/offers`, { credentials: "include" }).then((r) => r.json()),
        fetch(`${base}/financing-conditions`, { credentials: "include" }).then((r) => r.json()),
        fetch(`${base}/covenants`, { credentials: "include" }).then((r) => r.json()),
        fetch(`${base}/closing-readiness`, { credentials: "include" }).then((r) => r.json()),
      ]);
      setStack(s.stack);
      setPkg(p.package);
      setLenders((l.lenders as unknown[]) ?? []);
      setOffersPayload(o);
      setConditions((fc.conditions as unknown[]) ?? []);
      setCovenants((cov.covenants as unknown[]) ?? []);
      setClosing(cr);
    } catch {
      setMsg("Failed to load capital workspace.");
    }
  }, [dealId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function postStack() {
    setMsg(null);
    const res = await fetch(`/api/capital/deals/${dealId}/stack`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyType: "BALANCED", useEnginePreview: true }),
    });
    const j = await res.json();
    if (!res.ok) setMsg(j.error ?? "Stack save failed");
    else void load();
  }

  async function generatePackage() {
    setMsg(null);
    const res = await fetch(`/api/capital/deals/${dealId}/lender-package/generate`, {
      method: "POST",
      credentials: "include",
    });
    const j = await res.json();
    if (!res.ok) setMsg(j.error ?? "Package generation failed");
    else void load();
  }

  return (
    <div className="space-y-10">
      {msg ?
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{msg}</p>
      : null}

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Capital stack</h2>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
            onClick={() => void postStack()}
          >
            Save / refresh stack
          </button>
        </div>
        <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
          {JSON.stringify(stack, null, 2)}
        </pre>
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Lender package</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm"
              onClick={() => void generatePackage()}
            >
              Generate / regenerate
            </button>
            <a
              className="rounded-md border px-3 py-1.5 text-sm"
              href={`/api/capital/deals/${dealId}/lender-package/pdf`}
            >
              Download PDF
            </a>
          </div>
        </div>
        <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
          {pkg ? JSON.stringify(pkg, null, 2) : "No package yet."}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Lender pipeline</h2>
        <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
          {JSON.stringify(lenders, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Offers & comparison</h2>
        <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
          {JSON.stringify(offersPayload, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Financing conditions</h2>
        <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
          {JSON.stringify(conditions, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Covenants</h2>
        <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
          {JSON.stringify(covenants, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Closing readiness</h2>
        <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
          {JSON.stringify(closing, null, 2)}
        </pre>
      </section>
    </div>
  );
}
