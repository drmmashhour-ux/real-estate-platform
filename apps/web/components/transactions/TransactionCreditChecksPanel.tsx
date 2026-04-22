"use client";

import { useCallback, useState } from "react";

export type CreditCheckWire = {
  id: string;
  applicantName: string;
  email: string;
  status: string;
  score: number | null;
  reportUrl: string | null;
  provider: string;
  createdAt: string;
};

export function TransactionCreditChecksPanel(props: {
  transactionId: string;
  initialChecks: CreditCheckWire[];
}) {
  const [checks, setChecks] = useState(props.initialChecks);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/transactions/${props.transactionId}/credit`, { cache: "no-store" });
    const j = (await res.json()) as { checks?: CreditCheckWire[] };
    if (res.ok && j.checks) setChecks(j.checks);
  }, [props.transactionId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${props.transactionId}/credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantName: name, email }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? res.statusText);
      setName("");
      setEmail("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function refreshOne(checkId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${props.transactionId}/credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh", checkId }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? res.statusText);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-medium">Request tenant credit check</h2>
        <p className="mt-1 text-muted-foreground">
          Uses Trustii (simulated when API keys are not configured). Results attach to this transaction for compliance and
          underwriting.
        </p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
          <label className="flex flex-col gap-1 text-xs">
            Applicant name
            <input
              className="rounded border border-input bg-background px-2 py-1.5 text-sm"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              required
              disabled={busy}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Email
            <input
              type="email"
              className="rounded border border-input bg-background px-2 py-1.5 text-sm"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              disabled={busy}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Working…" : "Request credit check"}
            </button>
          </div>
        </form>
        {error ?
          <p className="mt-2 text-sm text-destructive">{error}</p>
        : null}
      </section>

      <section>
        <h2 className="font-medium">Checks</h2>
        {checks.length === 0 ?
          <p className="mt-2 text-muted-foreground">No credit checks yet.</p>
        : <ul className="mt-3 space-y-3">
            {checks.map((c) => (
              <li key={c.id} className="rounded border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{c.applicantName}</p>
                    <p className="text-muted-foreground">{c.email}</p>
                    <p className="mt-1 font-mono text-xs">
                      Status: {c.status}
                      {c.score != null ? ` · Score: ${c.score}` : ""}
                    </p>
                    {c.reportUrl ?
                      <a className="text-primary underline" href={c.reportUrl} target="_blank" rel="noreferrer">
                        Report link
                      </a>
                    : null}
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded border border-border px-2 py-1 text-xs disabled:opacity-50"
                    onClick={() => refreshOne(c.id)}
                  >
                    Refresh status
                  </button>
                </div>
              </li>
            ))}
          </ul>
        }
      </section>
    </div>
  );
}
