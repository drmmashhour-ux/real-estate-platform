"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { DarlinkLocale } from "@/lib/i18n/types";
import { cn } from "@/lib/cn";

const LABELS: Record<DarlinkLocale, string> = {
  ar: "العربية",
  en: "English",
};

export function LocaleToggle({
  className,
  onDark,
}: {
  className?: string;
  /** Higher contrast on navy headers */
  onDark?: boolean;
}) {
  const locale = useLocale() as DarlinkLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const switchTo = (target: DarlinkLocale) => {
    if (target === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: target });
    });
  };

  return (
    <div
      className={cn(
        "inline-flex rounded-[var(--darlink-radius-lg)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface-muted)] p-0.5 text-xs font-semibold",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {(["ar", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          onClick={() => switchTo(code)}
          className={cn(
            "rounded-[var(--darlink-radius-md)] px-2.5 py-1 transition",
            locale === code
              ? onDark
                ? "bg-white/20 text-white shadow-none"
                : "bg-[color:var(--darlink-surface)] text-[color:var(--darlink-text)] shadow-[var(--darlink-shadow-sm)]"
              : onDark
                ? "text-white/70 hover:text-white"
                : "text-[color:var(--darlink-text-muted)] hover:text-[color:var(--darlink-text)]",
          )}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
