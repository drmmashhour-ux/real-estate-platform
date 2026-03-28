import { getPlatformAppUrl } from "@/lib/platform-url";

const rows = [
  { label: "Active listings", value: "12", delta: "+2" },
  { label: "Pending offers", value: "5", delta: "3 new" },
  { label: "Unread messages", value: "8", delta: "" },
  { label: "Qualified leads", value: "14", delta: "+4 wk" },
] as const;

export function BrokerWorkspacePreview() {
  const dashboardUrl = `${getPlatformAppUrl()}/dashboard/broker`;

  return (
    <section id="broker-workspace" className="bg-[#080808] py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="font-serif text-3xl text-white md:text-4xl">Broker Workspace</h2>
        <p className="mx-auto mt-4 max-w-2xl text-[#CCCCCC]">
          Manage listings, offers, and client interactions in one place
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-4xl px-6">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#CCCCCC]/60">
              Overview
            </span>
            <span className="rounded-md bg-[#0F3D2E]/40 px-2 py-1 text-[10px] uppercase tracking-wider text-[#D4AF37]">
              Live preview
            </span>
          </div>

          <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.label} className="bg-[#111] p-5">
                <p className="text-xs uppercase tracking-wider text-[#CCCCCC]/50">{r.label}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-serif text-3xl text-white">{r.value}</span>
                  {r.delta ? <span className="text-xs text-[#D4AF37]/80">{r.delta}</span> : null}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-px border-t border-white/[0.06] md:grid-cols-3">
            {["Listings", "Offers", "Messages"].map((tab) => (
              <div key={tab} className="bg-[#0d0d0d] px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[#CCCCCC]/45">{tab}</p>
                <div className="mt-3 space-y-2">
                  <div className="h-2 rounded-full bg-white/[0.06]" />
                  <div className="h-2 w-4/5 rounded-full bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-[#D4AF37] px-10 py-3.5 text-sm font-semibold text-[#0B0B0B] shadow-[0_8px_32px_rgba(212, 175, 55,0.25)] transition hover:bg-[#D4AF37]"
          >
            Access Dashboard
            <span className="ml-2 text-[10px] font-normal uppercase tracking-widest opacity-80">
              ↗ app
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
