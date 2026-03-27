import type { UsageMetrics } from "@/modules/analytics/types";

type Props = { usage: UsageMetrics };

export function AdminUsageCharts({ usage }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#737373]">Volume (selected range)</p>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex justify-between border-b border-white/5 py-1">
            <span className="text-[#B3B3B3]">Messages sent</span>
            <span className="font-medium text-white">{usage.messagesSent}</span>
          </li>
          <li className="flex justify-between border-b border-white/5 py-1">
            <span className="text-[#B3B3B3]">Documents uploaded</span>
            <span className="font-medium text-white">{usage.documentsUploaded}</span>
          </li>
          <li className="flex justify-between border-b border-white/5 py-1">
            <span className="text-[#B3B3B3]">Offers created</span>
            <span className="font-medium text-white">{usage.offersCreated}</span>
          </li>
          <li className="flex justify-between border-b border-white/5 py-1">
            <span className="text-[#B3B3B3]">Contracts generated</span>
            <span className="font-medium text-white">{usage.contractsGenerated}</span>
          </li>
          <li className="flex justify-between py-1">
            <span className="text-[#B3B3B3]">Appointments booked</span>
            <span className="font-medium text-white">{usage.appointmentsBooked}</span>
          </li>
        </ul>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#737373]">Most active</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase text-[#737373]">Users</p>
            <ul className="mt-1 space-y-1 text-sm">
              {usage.mostActiveUsers.length === 0 ? (
                <li className="text-[#737373]">No data</li>
              ) : (
                usage.mostActiveUsers.map((u) => (
                  <li key={u.userId} className="flex justify-between gap-2 text-[#B3B3B3]">
                    <span className="truncate">{u.name || u.email}</span>
                    <span className="shrink-0 tabular-nums text-white">{u.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase text-[#737373]">Brokers</p>
            <ul className="mt-1 space-y-1 text-sm">
              {usage.mostActiveBrokers.length === 0 ? (
                <li className="text-[#737373]">No data</li>
              ) : (
                usage.mostActiveBrokers.map((u) => (
                  <li key={u.userId} className="flex justify-between gap-2 text-[#B3B3B3]">
                    <span className="truncate">{u.name || u.email}</span>
                    <span className="shrink-0 tabular-nums text-white">{u.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
