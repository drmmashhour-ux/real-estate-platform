import { Link } from "@/i18n/navigation";

export type AdminF1Filter = "all" | "pending" | "followup" | "active" | "expired" | "archived" | "stats";

const TAB_KEYS: { id: AdminF1Filter; msg: string }[] = [
  { id: "all", msg: "tabAll" },
  { id: "pending", msg: "tabPending" },
  { id: "followup", msg: "tabFollowup" },
  { id: "active", msg: "tabActive" },
  { id: "expired", msg: "tabExpired" },
  { id: "archived", msg: "tabArchived" },
  { id: "stats", msg: "tabStats" },
];

export function AdminF1Tabs({
  current,
  t,
}: {
  current: AdminF1Filter;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}) {
  return (
    <nav
      className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-4"
      aria-label={t("f1TabNavLabel")}
    >
      {TAB_KEYS.map(({ id, msg }) => {
        const isStats = id === "stats";
        const isActive = current === id;
        const href = isStats ? "/admin/stats" : id === "all" ? "/admin/payment-requests" : `/admin/payment-requests?filter=${id}`;
        return (
          <Link
            key={id}
            href={href}
            className={
              isActive
                ? "inline-flex min-h-10 items-center rounded-full bg-amber-200/90 px-3 py-1.5 text-sm font-bold text-amber-950"
                : "inline-flex min-h-10 items-center rounded-full bg-white px-3 py-1.5 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
            }
          >
            {id === "stats" ? `📊 ${t(msg)}` : t(msg)}
          </Link>
        );
      })}
    </nav>
  );
}
