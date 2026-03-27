import type { DashboardOverview } from "@/modules/analytics/types";

type Props = { overview: DashboardOverview };

export function AdminKPICards({ overview }: Props) {
  const card =
    "rounded-xl border border-white/10 bg-black/40 px-4 py-3 shadow-sm";
  const label = "text-[11px] font-semibold uppercase tracking-wider text-[#737373]";
  const value = "mt-1 text-2xl font-semibold text-white";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <div className={card}>
        <p className={label}>Users</p>
        <p className={value}>{overview.users.total.toLocaleString()}</p>
        <p className="mt-1 text-xs text-[#737373]">Active (30d): {overview.users.active.toLocaleString()}</p>
      </div>
      <div className={card}>
        <p className={label}>CRM clients</p>
        <p className={value}>{overview.clients.total.toLocaleString()}</p>
        <p className="mt-1 text-xs text-[#737373]">Active pipeline deals: {overview.deals.active}</p>
      </div>
      <div className={card}>
        <p className={label}>Offers</p>
        <p className={value}>{overview.offers.total.toLocaleString()}</p>
        <p className="mt-1 text-xs text-[#737373]">
          Accepted {overview.offers.accepted} · Review {overview.offers.underReview}
        </p>
      </div>
      <div className={card}>
        <p className={label}>Contracts</p>
        <p className={value}>{overview.contracts.total.toLocaleString()}</p>
        <p className="mt-1 text-xs text-[#737373]">
          Pending sign {overview.contracts.pending} · Done {overview.contracts.completed}
        </p>
      </div>
      <div className={card}>
        <p className={label}>Appointments</p>
        <p className={value}>{overview.appointments.total.toLocaleString()}</p>
        <p className="mt-1 text-xs text-[#737373]">
          Pending {overview.appointments.pending} · Upcoming {overview.appointments.upcoming}
        </p>
      </div>
      <div className={card}>
        <p className={label}>Documents</p>
        <p className={value}>{overview.documents.total.toLocaleString()}</p>
        <p className="mt-1 text-xs text-[#737373]">
          Portfolio deals {overview.portfolio.investmentDeals.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
