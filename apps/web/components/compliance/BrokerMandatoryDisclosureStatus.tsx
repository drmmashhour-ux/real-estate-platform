/**
 * OACIQ mandatory broker disclosure — compact status for deal surfaces.
 */
export function BrokerMandatoryDisclosureStatus({
  provided,
  enforcementEnabled,
}: {
  provided: boolean;
  enforcementEnabled: boolean;
}) {
  if (!enforcementEnabled && !provided) {
    return null;
  }
  if (provided) {
    return (
      <div
        className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100"
        data-compliance="broker_disclosure_status"
      >
        <span className="font-semibold text-emerald-300">Broker disclosure provided</span>
        <span className="text-emerald-100/80"> — OACIQ role and interest attestation on file.</span>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
      <span className="font-semibold text-amber-300">Broker disclosure required</span>
      <span className="text-amber-100/80">
        {" "}
        — the responsible broker must file POST /api/compliance/oaciq/broker-disclosure before certain actions.
      </span>
    </div>
  );
}
