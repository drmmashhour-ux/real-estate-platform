import type { LegalPendingAction } from "@/modules/legal/legal.types";

export function LegalPendingActionsCard({ actions }: { actions: LegalPendingAction[] }) {
  return (
    <section
      className="rounded-2xl border border-premium-gold/25 bg-black/40 p-5"
      aria-labelledby="legal-pending-heading"
    >
      <h2 id="legal-pending-heading" className="text-sm font-semibold text-white">
        Pending actions
      </h2>
      <p className="mt-1 text-xs text-[#737373]">Workflow steps that still need attention in-product.</p>
      {actions.length === 0 ? (
        <p className="mt-4 text-sm text-[#9CA3AF]">No blocking steps detected from current platform records.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {actions.map((a) => (
            <li key={a.id} className="rounded-xl border border-white/10 bg-[#121212] px-4 py-3">
              <p className="text-sm font-medium text-premium-gold">{a.label}</p>
              <p className="mt-1 text-xs text-[#B3B3B3]">{a.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
