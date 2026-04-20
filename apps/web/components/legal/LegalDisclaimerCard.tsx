import type { LegalDisclaimerItem } from "@/modules/legal/legal.types";

export function LegalDisclaimerCard({
  paragraphs,
  items,
}: {
  paragraphs: string[];
  items?: LegalDisclaimerItem[];
}) {
  const rows = items && items.length > 0 ? items.map((x) => x.text) : paragraphs;

  return (
    <aside
      className="rounded-2xl border border-premium-gold/30 bg-[#151515] p-5 text-xs leading-relaxed text-[#A3A3A3]"
      aria-label="Legal disclaimers"
    >
      <p className="font-semibold uppercase tracking-[0.2em] text-premium-gold">Important</p>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        {rows.map((p, i) => (
          <li key={items?.[i]?.id ?? `d-${i}`}>{p}</li>
        ))}
      </ul>
    </aside>
  );
}
