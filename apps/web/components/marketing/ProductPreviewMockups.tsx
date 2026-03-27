/**
 * Static marketing-only UI simulations for the "Product preview" section.
 * Not connected to live data — gives visitors a realistic sense of the workspace.
 */

export function DashboardPreviewMockup() {
  const kpis = [
    { label: "Active listings", value: "24", delta: "+3 vs last week", accent: true },
    { label: "Pipeline value", value: "$12.4M", delta: "Across 8 stages", accent: false },
    { label: "Closing (30d)", value: "7", delta: "$3.1M scheduled", accent: false },
    { label: "New leads (7d)", value: "12", delta: "4 need follow-up", accent: false },
  ] as const;

  const rows = [
    { deal: "Marina Loft — Plateau", stage: "Offer", amount: "$1.85M", tone: "text-[#C9A646]" },
    { deal: "124 Rue du Lac", stage: "Qualified", amount: "Visit Thu", tone: "text-slate-300" },
    { deal: "Penthouse Belvedere", stage: "Lead", amount: "Intake", tone: "text-slate-400" },
  ] as const;

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#141414] to-[#0a0a0a] p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-[#C9A646]/25 ring-1 ring-[#C9A646]/40" aria-hidden />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A646]">Brokerage</p>
            <p className="text-sm font-semibold text-white">Good morning, Sarah</p>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="hidden min-w-[140px] rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] text-slate-500 sm:block">
            Search deals, contacts…
          </div>
          <span className="flex h-8 min-w-[2rem] items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[10px] font-semibold text-[#C9A646]">
            3
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`rounded-lg border p-3 ${
              k.accent ? "border-[#C9A646]/35 bg-[#C9A646]/[0.07]" : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{k.label}</p>
            <p className={`mt-1 text-lg font-bold tabular-nums ${k.accent ? "text-[#E8D5A0]" : "text-white"}`}>
              {k.value}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">{k.delta}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-black/40">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pipeline activity</span>
          <span className="text-[10px] text-[#C9A646]">View all →</span>
        </div>
        <ul className="divide-y divide-white/[0.06]">
          {rows.map((r) => (
            <li key={r.deal} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
              <span className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-[#C9A646]/40 to-[#C9A646]/10 ring-1 ring-white/10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white">{r.deal}</p>
                <p className="text-[10px] text-slate-500">Updated 2h ago · {r.stage}</p>
              </div>
              <span className={`text-xs font-semibold tabular-nums ${r.tone}`}>{r.amount}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function CrmPipelinePreviewMockup() {
  const columns = [
    { name: "New", count: 5, color: "bg-slate-500/20 text-slate-300" },
    { name: "Active", count: 12, color: "bg-[#C9A646]/15 text-[#E8D5A0]" },
    { name: "Offer", count: 4, color: "bg-amber-500/15 text-amber-200" },
    { name: "Closing", count: 3, color: "bg-emerald-500/15 text-emerald-200" },
  ] as const;

  const cards = [
    { col: 0, name: "A. Benali", hint: "Plateau triplex", meta: "Web · 1d" },
    { col: 1, name: "M. Chen", hint: "Outremont condo", meta: "Call · Stage visit" },
    { col: 1, name: "R. Okonkwo", hint: "NDG rowhouse", meta: "Referral" },
    { col: 2, name: "L. Fortin", hint: "$1.2M accepted", meta: "Lawyer review" },
    { col: 3, name: "K. Singh", hint: "Closing Mar 28", meta: "Financing clear" },
  ] as const;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A646]">CRM</p>
          <p className="text-sm font-semibold text-white">Pipeline</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-400">
          24 open deals
        </span>
      </div>
      <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="grid min-w-[300px] grid-cols-4 gap-1.5 sm:min-w-0 sm:gap-2">
          {columns.map((c) => (
            <div
              key={c.name}
              className={`rounded-t-lg border border-b-0 border-white/10 px-1.5 py-2 text-center sm:px-2 ${c.color}`}
            >
              <p className="text-[10px] font-bold">{c.name}</p>
              <p className="text-[9px] opacity-80">{c.count}</p>
            </div>
          ))}
        </div>
        <div className="grid min-h-[168px] min-w-[300px] grid-cols-4 gap-1.5 border border-white/10 bg-[#080808] p-2 sm:min-w-0 sm:gap-2">
          {columns.map((_, ci) => (
            <div key={ci} className="space-y-1.5">
              {cards
                .filter((x) => x.col === ci)
                .map((c) => (
                  <div
                    key={c.name}
                    className="rounded-lg border border-white/10 bg-white/[0.05] p-2 shadow-sm shadow-black/40"
                  >
                    <p className="text-[10px] font-semibold text-white">{c.name}</p>
                    <p className="mt-0.5 truncate text-[9px] text-slate-400">{c.hint}</p>
                    <p className="mt-1 text-[9px] text-slate-500">{c.meta}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OfferContractPreviewMockup() {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Offer #2841</p>
          <p className="mt-1 text-sm font-semibold text-white">Marina Loft — 880 Ave du Parc</p>
          <p className="mt-1 text-[10px] text-slate-500">Listing MLS® 12345678 · Representing buyer</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
          Under review
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Offer price</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[#E8D5A0]">$1,850,000</p>
          <p className="mt-1 text-[10px] text-slate-500">Deposit 5% · Financing 21 days</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Key dates</p>
          <ul className="mt-2 space-y-1.5 text-[10px] text-slate-300">
            <li className="flex justify-between gap-2">
              <span className="text-slate-500">Inspection</span>
              <span>Mar 26 · 10:00</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="text-slate-500">Response deadline</span>
              <span className="text-[#C9A646]">Mar 24 · 17:00</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Latest note</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          Seller requested clarification on inclusions (lighting fixtures in master). Counter draft saved v3 — pending
          your review.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-lg bg-[#C9A646] px-4 py-2 text-[10px] font-bold text-black">Open contract</span>
        <span className="rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-[10px] font-semibold text-white">
          Message co-broke
        </span>
      </div>
    </div>
  );
}

export function DocumentRoomPreviewMockup() {
  const files = [
    { name: "Purchase-agreement-v3.pdf", tag: "Contract", size: "420 KB", status: "Signed" },
    { name: "Seller-disclosure-2026.pdf", tag: "Disclosure", size: "1.2 MB", status: "Viewed" },
    { name: "ID-verification-buyer.png", tag: "Compliance", size: "890 KB", status: "Verified" },
  ] as const;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A646]">Deal room</p>
          <p className="text-sm font-semibold text-white">Marina Loft / Offer #2841</p>
          <p className="text-[10px] text-slate-500">Shared with buyer · seller counsel · mortgage (read-only)</p>
        </div>
        <span className="rounded-lg border border-[#C9A646]/40 bg-[#C9A646]/15 px-3 py-1.5 text-[10px] font-semibold text-[#E8D5A0]">
          Upload
        </span>
      </div>

      <div className="space-y-2">
        {files.map((f) => (
          <div
            key={f.name}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[10px] font-bold text-slate-400">
              PDF
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{f.name}</p>
              <p className="text-[10px] text-slate-500">
                {f.tag} · {f.size}
              </p>
            </div>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] text-slate-400">{f.status}</span>
            <span className="text-[10px] font-semibold text-[#C9A646]">Open</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-[9px] text-slate-600">Watermarking & audit trail on every download — simulated</p>
    </div>
  );
}

export function AnalyticsPreviewMockup() {
  const bars = [
    { label: "Jan", h: 42, v: "$2.1M" },
    { label: "Feb", h: 58, v: "$2.8M" },
    { label: "Mar", h: 48, v: "$2.4M" },
    { label: "Apr", h: 72, v: "$3.6M" },
    { label: "May", h: 64, v: "$3.2M" },
    { label: "Jun", h: 78, v: "$3.9M" },
  ] as const;

  const stats = [
    { k: "Volume (YTD)", v: "$18.4M", sub: "+12% vs prior" },
    { k: "Lead → visit", v: "34%", sub: "Team avg" },
    { k: "Avg. days to offer", v: "11", sub: "Residential" },
  ] as const;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A646]">Analytics</p>
          <p className="text-sm font-semibold text-white">Production — rolling 6 months</p>
        </div>
        <span className="text-[10px] text-slate-500">Demo figures</span>
      </div>

      <div className="rounded-lg border border-white/10 bg-gradient-to-b from-[#C9A646]/[0.08] to-transparent p-3">
        <div className="flex h-[112px] items-end justify-between gap-1 px-0.5 sm:gap-1.5">
          {bars.map((b) => {
            const barPx = Math.round((b.h / 100) * 88);
            return (
              <div key={b.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="text-[9px] font-semibold tabular-nums text-[#E8D5A0]">{b.v}</span>
                <div
                  className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-[#C9A646]/80 to-[#C9A646]/30 shadow-sm shadow-[#C9A646]/20"
                  style={{ height: `${barPx}px` }}
                />
                <span className="text-[9px] text-slate-500">{b.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
        {stats.map((s) => (
          <div key={s.k} className="text-center">
            <p className="text-[9px] uppercase tracking-wide text-slate-500">{s.k}</p>
            <p className="mt-1 text-sm font-bold tabular-nums text-white">{s.v}</p>
            <p className="text-[9px] text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
