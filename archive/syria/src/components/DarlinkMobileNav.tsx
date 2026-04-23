import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth";

/** Fixed bottom navigation — visible on small screens only; Darlink shell only. */
export async function DarlinkMobileNav() {
  const t = await getTranslations("nav");
  const user = await getSessionUser();

  const items: { href: string; label: string }[] = [
    { href: "/", label: t("home") },
    { href: "/buy", label: t("buy") },
    { href: "/rent", label: t("rent") },
    { href: "/bnhub/stays", label: t("bnhub") },
    user
      ? { href: "/dashboard", label: t("dashboard") }
      : { href: "/login", label: t("signIn") },
  ];

  return (
    <nav
      className="darlink-mobile-nav fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-7xl items-stretch justify-between gap-1 px-2 py-2 text-[11px] font-semibold text-[color:var(--darlink-text)]">
        {items.map((item) => (
          <li key={item.href} className="min-w-0 flex-1 text-center">
            <Link
              href={item.href}
              className="block truncate rounded-[var(--darlink-radius-md)] px-1 py-2 text-[color:var(--darlink-text-muted)] hover:bg-[color:var(--darlink-surface-muted)] hover:text-[color:var(--darlink-text)]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
