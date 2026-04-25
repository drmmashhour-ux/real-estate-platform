"use client";

import { useCallback, useState } from "react";
import { BrokerTrustBadges } from "@/components/trust/BrokerTrustBadges";
import { TRUST_COPY } from "@/lib/trust/broker-trust";

const NOTICE = "Draft assistance — broker review required.";

export type ContractComplianceFooter = {
  locale: string;
  dealId: string;
  brokerUserId: string | null;
  licenceNumber: string | null;
  licenceStatus: string | null;
  licensedOaciq: boolean;
  insuredFarcia: boolean;
  independentBroker: boolean;
  insuranceStatement: string;
};

export function ContractWorkspace({
  dealId,
  defaultFormKey = "pp_mandatory_residential_immovable",
  complianceFooter = null,
}: {
  dealId: string;
  defaultFormKey?: string;
  complianceFooter?: ContractComplianceFooter | null;
}) {
  const [formKey, setFormKey] = useState(defaultFormKey);
  const [prefill, setPrefill] = useState<unknown>(null);
  const [validation, setValidation] = useState<unknown>(null);
  const [suggestions, setSuggestions] = useState<unknown>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(
    async (path: string, init?: RequestInit) => {
      setLoading(path);
      setErr(null);
      try {
        const res = await fetch(path, { ...init, credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Request failed");
        return data;
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Error");
        return null;
      } finally {
        setLoading(null);
      }
    },
    [],
  );

  return (
    <div className="space-y-6 rounded-2xl border border-ds-gold/25 bg-black/40 p-5">
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/90">
        <p className="font-semibold text-amber-200">{NOTICE}</p>
        <p className="mt-1 text-xs text-amber-100/70">
          Specimen-oriented intelligence only. Official OACIQ execution forms remain publisher/broker-authorized. No legal finality is implied.
        </p>
      </div>

      <section>
        <h3 className="text-sm font-medium text-ds-text">Form key (registry)</h3>
        <input
          value={formKey}
          onChange={(e) => setFormKey(e.target.value)}
          className="mt-2 w-full rounded-lg border border-ds-border bg-black/50 px-3 py-2 text-sm text-ds-text"
        />
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void run(`/api/deals/${dealId}/prefill/${encodeURIComponent(formKey)}`, { method: "POST" }).then(setPrefill)}
          className="rounded-lg bg-ds-gold/90 px-3 py-2 text-xs font-medium text-black"
        >
          Run prefill
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void run(`/api/deals/${dealId}/validate`, { method: "POST" }).then(setValidation)}
          className="rounded-lg border border-ds-border px-3 py-2 text-xs text-ds-gold"
        >
          Run validation
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void run(`/api/deals/${dealId}/suggestions/run`, { method: "POST" }).then(setSuggestions)}
          className="rounded-lg border border-ds-border px-3 py-2 text-xs text-ds-text-secondary"
        >
          Run clause suggestions
        </button>
        <button type="button" disabled={!!loading} onClick={() => void run(`/api/deals/${dealId}/sources`)} className="rounded-lg border border-ds-border px-3 py-2 text-xs text-ds-text-secondary">
          Load sources
        </button>
      </div>
      {loading ? <p className="text-xs text-ds-text-secondary">{loading}…</p> : null}
      {err ? <p className="text-xs text-red-400">{err}</p> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-ds-card/40 p-4">
          <h4 className="text-xs font-semibold uppercase text-ds-gold/80">Prefill</h4>
          <pre className="mt-2 max-h-64 overflow-auto text-[11px] text-ds-text-secondary">{prefill ? JSON.stringify(prefill, null, 2) : "—"}</pre>
        </div>
        <div className="rounded-xl border border-white/10 bg-ds-card/40 p-4">
          <h4 className="text-xs font-semibold uppercase text-ds-gold/80">Validation</h4>
          <pre className="mt-2 max-h-64 overflow-auto text-[11px] text-ds-text-secondary">{validation ? JSON.stringify(validation, null, 2) : "—"}</pre>
        </div>
        <div className="rounded-xl border border-white/10 bg-ds-card/40 p-4 lg:col-span-2">
          <h4 className="text-xs font-semibold uppercase text-ds-gold/80">Clause / knowledge suggestions</h4>
          <pre className="mt-2 max-h-64 overflow-auto text-[11px] text-ds-text-secondary">{suggestions ? JSON.stringify(suggestions, null, 2) : "—"}</pre>
        </div>
      </section>

      {complianceFooter ? (
        <section
          className="rounded-xl border border-ds-border bg-ds-card/30 p-4"
          aria-labelledby="contract-broker-compliance-heading"
        >
          <h4
            id="contract-broker-compliance-heading"
            className="text-xs font-semibold uppercase tracking-wide text-ds-gold/80"
          >
            Broker compliance (disclosure)
          </h4>
          <dl className="mt-3 space-y-3 text-xs text-ds-text-secondary">
            <div>
              <dt className="font-medium text-ds-text/80">OACIQ licence number on file</dt>
              <dd className="mt-1 text-ds-text">{complianceFooter.licenceNumber?.trim() || "—"}</dd>
              {complianceFooter.licenceStatus ? (
                <dd className="mt-1 text-[11px] text-ds-text-secondary/90">
                  Status on file: {complianceFooter.licenceStatus}
                </dd>
              ) : null}
            </div>
            <div>
              <dt className="font-medium text-ds-text/80">Professional liability (FARCIQ)</dt>
              <dd className="mt-1 text-ds-text/90">{complianceFooter.insuranceStatement}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <BrokerTrustBadges
              licensedOaciq={complianceFooter.licensedOaciq}
              insuredFarcia={complianceFooter.insuredFarcia}
              independentBroker={complianceFooter.independentBroker}
              locale={complianceFooter.locale}
              brokerUserId={complianceFooter.brokerUserId}
              dealId={complianceFooter.dealId}
              surface="contract"
              variant="dashboard"
            />
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-ds-text-secondary/90">{TRUST_COPY.platformNotRegulator}</p>
        </section>
      ) : null}
    </div>
  );
}
