"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "lecipm_law25_consent_v1";

/**
 * Québec Law 25 — consent for non-essential cookies/analytics when enabled via `NEXT_PUBLIC_FEATURE_LAW25_BANNER=1`.
 */
export function Law25ConsentBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ok = window.localStorage.getItem(STORAGE_KEY);
      setVisible(ok !== "1");
    } catch {
      setVisible(true);
    }
  }, [pathname]);

  if (!visible) return null;

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Privacy consent"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 p-4 text-sm shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 md:p-3"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-muted-foreground">
          We use cookies and similar technologies to run the platform and, with your consent, to measure usage. See our{" "}
          <Link href="/en/ca/legal/data-notice" className="underline underline-offset-2">
            data usage notice
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="rounded-md border border-border bg-background px-3 py-2 text-foreground hover:bg-muted"
            onClick={accept}
          >
            Essential only
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-primary-foreground hover:opacity-90"
            onClick={accept}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
