import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { MobileNavMenu } from "@/components/MobileNavMenu";
import { DARLINK_COPY, getHadiahBrandLockup } from "@/lib/brand/darlink-copy";
import { isBnhubInSyriaUI } from "@/lib/platform-flags";
import { HadiahLogo } from "@/components/brand/HadiahLogo";

/** Hadiah Link shell header — Syria product lane only. */
export async function SyriaHeader() {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const user = await getSessionUser();
  const brandCopy = locale.startsWith("en") ? DARLINK_COPY.en : DARLINK_COPY.ar;
  const lock = getHadiahBrandLockup(locale);
  const showBnhubNav = isBnhubInSyriaUI();

  return (
    <header
      data-demo-highlight="hero"
      className="sticky top-0 z-50 border-b border-white/10 bg-[color:var(--darlink-bg)] text-[color:var(--darlink-off-white)] shadow-[var(--darlink-shadow-sm)]"
    >
      <div className="darlink-header-bar mx-auto flex min-w-0 max-w-7xl items-center justify-between gap-3 overflow-hidden px-3 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
        <Link
          href="/"
          className="flex min-w-0 max-w-[min(100%,min(100vw-5rem,360px))] items-center gap-2.5 transition hover:opacity-95 min-[400px]:gap-3"
          aria-label={`${brandCopy.name} — ${brandCopy.tagline}`}
        >
          <HadiahLogo variant="on-dark" className="size-8 shrink-0 min-[400px]:size-9 sm:size-10" />
          <div className="min-w-0 flex-1 text-start [text-wrap:balance]">
            <span className="block max-w-full truncate text-sm font-bold leading-tight text-white min-[400px]:text-base">
              {lock.primary}
            </span>
            <span
              className="mt-0.5 block max-w-full truncate text-xs font-medium text-white/80 sm:text-sm"
              dir={lock.secondaryDir}
            >
              {lock.secondary}
            </span>
          </div>
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
          {showBnhubNav ? (
            <Link className="rounded-[var(--darlink-radius-md)] px-3 py-2 text-white/90 transition hover:bg-white/10" href="/bnhub/stays">
              {t("bnhub")}
            </Link>
          ) : null}
          <Link
            className="hadiah-btn-primary inline-flex min-h-10 items-center justify-center rounded-[var(--darlink-radius-lg)] px-4 py-2 text-sm font-semibold"
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
          <MobileNavMenu signedIn={!!user} isAdmin={user?.role === "ADMIN"} showBnhub={showBnhubNav} />
        </div>
      </div>
    </header>
  );
}
