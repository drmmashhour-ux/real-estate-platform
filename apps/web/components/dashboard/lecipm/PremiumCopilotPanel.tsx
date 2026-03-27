import Link from "next/link";

const ACTIONS = [
  { label: "Improve a listing", href: "/dashboard/seller/listings", hint: "Open seller hub" },
  { label: "Deal tools", href: "/dashboard/investor", hint: "Scenarios & alerts" },
  { label: "AI workspace", href: "/dashboard/ai", hint: "Copilot & assistants" },
];

export function PremiumCopilotPanel() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#C9A646]/20 bg-[#121212] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Next actions</p>
      <p className="text-xs text-slate-500">What should you do next?</p>
      <ul className="space-y-2">
        {ACTIONS.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className="block rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm font-medium text-slate-100 transition hover:border-[#C9A646]/35 hover:bg-white/[0.04]"
            >
              {a.label}
              <span className="mt-0.5 block text-[11px] font-normal text-slate-500">{a.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
