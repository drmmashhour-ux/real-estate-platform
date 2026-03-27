"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog, { initPosthog } from "@/lib/posthogClient";

/** Call once inside the app shell — enables client captures + manual pageviews. */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPosthog();
  }, []);
  return <>{children}</>;
}

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPosthog();
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: typeof window !== "undefined" ? window.location.href : url });
  }, [pathname, searchParams]);

  return null;
}

export { posthog };
