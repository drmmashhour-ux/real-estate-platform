import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { MobileNavMenu } from "@/components/MobileNavMenu";
import { DARLINK_COPY } from "@/lib/brand/darlink-copy";
import { DarlinkWordmark } from "@/components/brand/DarlinkWordmark";

/** Darlink shell header — Syria product lane only; no LECIPM chrome. */
export async function SyriaHeader() {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const user = await getSessionUser();
  const brandCopy = locale.startsWith("en") ? DARLINK_COPY.en : DARLINK_COPY.ar;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[color:var(--darlink-bg)] text-[color:var(--darlink-off-white)] shadow-[var(--darlink-shadow-md)] backdrop-blur-md">
      <div className="darlink-header-bar mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 max-w-[min(100%,280px)] shrink-0 items-center transition hover:opacity-95 sm:max-w-[340px]"
          aria-label={`${brandCopy.name} — ${brandCopy.tagline}`}
        >
          <DarlinkWordmark variant="on-dark" className="h-9 w-auto min-w-[200px] sm:h-10" />
        </Link>

        <nav className="hidden flex-wrap items-center justify-end gap-1 text-sm font-medium md:flex">
          <Link className="rounded-[var(--darlink-radius-md)] px-3 py-2 text-white/90 transition hover:bg-white/10" href="/">
            {t("home")}
          </Link>
          <Link className="rounded-[var(--darlink-radius-md)] px-3 py-2 text-white/90 transition hover:bg-white/10" href="/buy">
            {t("buy")}
          </Link>
          <Link className="rounded-[var(--darlink-radius-md)] px-3 py-2 text-white/90 transition hover:bg-white/10" href="/rent">
            {t("rent")}
          </Link>
          <Link className="rounded-[var(--darlink-radius-md)] px-3 py-2 text-white/90 transition hover:bg-white/10" href="/bnhub/stays">
            {t("bnhub")}
          </Link>
          <Link
            className="rounded-[var(--darlink-radius-lg)] bg-[color:var(--darlink-accent)] px-4 py-2 font-semibold text-white shadow-[var(--darlink-shadow-sm)] transition hover:opacity-[0.96]"
            href="/sell"
          >
            {t("sell")}
          </Link>
          {user ? (
            <>
              <Link className="rounded-[var(--darlink-radius-md)] px-3 py-2 text-white/90 transition hover:bg-white/10" href="/dashboard">
                {t("dashboard")}
              </Link>
              {user.role === "ADMIN" ? (
                <Link className="rounded-[var(--darlink-radius-md)] px-3 py-2 text-white/90 transition hover:bg-white/10" href="/admin">
                  {t("admin")}
                </Link>
              ) : null}
            </>
          ) : (
            <Link className="rounded-[var(--darlink-radius-md)] px-3 py-2 text-white/90 transition hover:bg-white/10" href="/login">
              {t("signIn")}
            </Link>
          )}
          <LocaleToggle onDark className="darlink-ms-auto" />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <MobileNavMenu signedIn={!!user} isAdmin={user?.role === "ADMIN"} />
        </div>
      </div>
    </header>
  );
}
