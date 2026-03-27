import { StatusPill } from "@/components/ui/StatusPill";

export type MissingItemSeverity = "danger" | "warning" | "success";

export type MissingItemRow = {
  id: string;
  label: string;
  severity: MissingItemSeverity;
};

export function MissingItemsList({
  title,
  items,
  emptyMessage,
}: {
  title?: string;
  items: MissingItemRow[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[#A1A1A1]">{emptyMessage ?? "Nothing to show yet."}</p>
    );
  }

  return (
    <div className="space-y-2">
      {title ? <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A1A1A1]">{title}</p> : null}
      <ul className="space-y-2">
        {items.map((row) => (
          <li key={row.id}>
            <StatusPill
              tone={row.severity === "danger" ? "danger" : row.severity === "warning" ? "warning" : "success"}
              icon={
                <span aria-hidden className="text-[10px]">
                  {row.severity === "danger" ? "🔴" : row.severity === "warning" ? "🟡" : "🟢"}
                </span>
              }
            >
              {row.label}
            </StatusPill>
          </li>
        ))}
      </ul>
    </div>
  );
}
