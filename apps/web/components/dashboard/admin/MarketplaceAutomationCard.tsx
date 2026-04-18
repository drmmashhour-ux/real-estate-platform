export function MarketplaceAutomationCard(props: {
  autonomousMarketplace: boolean;
  controlledExecution: boolean;
  approvals: boolean;
}) {
  return (
    <div className="rounded-xl border border-emerald-900/30 bg-slate-950/50 p-4">
      <p className="text-xs uppercase text-emerald-200/90">Automation surface</p>
      <dl className="mt-2 space-y-1 text-sm text-slate-400">
        <div className="flex justify-between gap-4">
          <dt>Marketplace engine</dt>
          <dd className="font-mono text-slate-200">{props.autonomousMarketplace ? "on" : "off"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Controlled execution</dt>
          <dd className="font-mono text-slate-200">{props.controlledExecution ? "on" : "off"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Approvals queue</dt>
          <dd className="font-mono text-slate-200">{props.approvals ? "on" : "off"}</dd>
        </div>
      </dl>
    </div>
  );
}
