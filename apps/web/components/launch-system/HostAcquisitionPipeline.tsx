import type { MontrealHostAcquisitionSnapshot } from "@/modules/host-acquisition/host-acquisition.service";

type Snapshot = MontrealHostAcquisitionSnapshot;

export function HostAcquisitionPipeline({ snapshot }: { snapshot: Snapshot }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Montreal host acquisition (first {snapshot.targetFirstHosts})</h2>
      <p className="mt-1 text-xs text-zinc-500">{snapshot.disclaimers[0]}</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Listing acquisition leads (MTL filter)</dt>
          <dd className="text-zinc-200">{snapshot.listingAcquisitionMontrealCount}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Outreach CRM rows</dt>
          <dd className="text-zinc-200">{snapshot.outreachLeadsTotal}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Active hosts (platform)</dt>
          <dd className="text-zinc-200">{snapshot.activeHostsPlatformWide}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <p className="text-xs font-medium text-zinc-500">Outreach by status</p>
        <ul className="mt-1 text-sm text-zinc-300">
          {snapshot.outreachByStatus.map((o) => (
            <li key={o.status}>
              {o.status}: {o.count}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs text-zinc-600">Priority zones: {snapshot.priorityZones.join(", ")}</p>
    </section>
  );
}
