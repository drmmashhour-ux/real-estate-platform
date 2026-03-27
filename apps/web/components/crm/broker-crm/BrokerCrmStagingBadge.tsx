/** Visible in staging/demo so brokers know CRM data stays in the test environment. */
export function BrokerCrmStagingBadge() {
  if (process.env.NEXT_PUBLIC_ENV !== "staging") return null;
  return (
    <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-amber-200/90">
      Demo / staging
    </span>
  );
}
