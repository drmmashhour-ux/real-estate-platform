"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LocaleToggle } from "@/components/ui/LocaleToggle";
import { cn } from "@/lib/cn";

export function MobileNavMenu({
  signedIn,
  isAdmin,
  showBnhub = true,
}: {
  signedIn: boolean;
  isAdmin: boolean;
  /** Stays (BNHub) — hidden in Syria MVP. */
  showBnhub?: boolean;
}) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="flex flex-col gap-1.5 rounded-[var(--darlink-radius-md)] p-2 text-white hover:bg-white/10 md:hidden"
        aria-expanded={open}
        aria-label={open ? t("closeMenu") : t("openMenu")}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={cn("h-0.5 w-6 bg-current transition", open && "translate-y-2 rotate-45")} />
        <span className={cn("h-0.5 w-6 bg-current transition", open && "opacity-0")} />
        <span className={cn("h-0.5 w-6 bg-current transition", open && "-translate-y-2 -rotate-45")} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label={t("closeMenu")} onClick={() => setOpen(false)} />
          <nav
            className={cn(
              "absolute start-0 top-0 flex h-full w-[min(100%,20rem)] flex-col gap-1 border-e border-white/10 bg-[color:var(--darlink-bg)] p-4 pt-6 text-white shadow-[var(--darlink-shadow-sm)]",
            )}
          >
            <Link
              href="/"
              className="rounded-[var(--darlink-radius-md)] px-3 py-3 text-sm font-medium hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              {t("home")}
            </Link>
            <Link
              href="/buy"
              className="rounded-[var(--darlink-radius-md)] px-3 py-3 text-sm font-medium hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              {t("buy")}
            </Link>
            <Link
              href="/rent"
              className="rounded-[var(--darlink-radius-md)] px-3 py-3 text-sm font-medium hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              {t("rent")}
            </Link>
            {showBnhub ? (
              <Link
                href="/bnhub/stays"
                className="rounded-[var(--darlink-radius-md)] px-3 py-3 text-sm font-medium hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {t("bnhub")}
              </Link>
            ) : null}
            <Link
              href="/sell"
              className="hadiah-btn-primary w-full rounded-[var(--darlink-radius-lg)] px-3 py-3 text-center text-sm font-semibold"
              onClick={() => setOpen(false)}
            >
              {t("sell")}
            </Link>
            {signedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-[var(--darlink-radius-md)] px-3 py-3 text-sm font-medium hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  {t("dashboard")}
                </Link>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="rounded-[var(--darlink-radius-md)] px-3 py-3 text-sm font-medium hover:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    {t("admin")}
                  </Link>
                ) : null}
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-[var(--darlink-radius-md)] px-3 py-3 text-sm font-medium hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {t("signIn")}
              </Link>
            )}
            <div className="mt-auto border-t border-white/10 pt-4">
              <LocaleToggle onDark />
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
