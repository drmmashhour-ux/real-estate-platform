export function TeamActivityFeed() {
  return (
    <aside className="rounded-2xl border border-ds-border bg-ds-card/40 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-ds-text-secondary">Recent activity</h4>
      <p className="mt-3 text-xs leading-relaxed text-ds-text-secondary">
        Assignment changes, internal threads, and notes are recorded in <code className="text-ds-gold/80">broker_workspace_audit_events</code>{" "}
        for administrators. This feed UI will surface filtered events in a later iteration.
      </p>
    </aside>
  );
}
