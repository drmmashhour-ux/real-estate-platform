import { EARLY_USER_CAP } from "@/lib/growth/earlyUserConstants";
import { getEarlyUserCountCached } from "@/lib/growth/earlyUsers";
import {
  getLaunchBannerUrgency,
  launchBannerCtaLabel,
} from "@/lib/growth/launchBannerModel";
import { isPlatformLaunchRunning } from "@/lib/launch/controller";
import { flags } from "@/lib/flags";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/src/services/analytics";

import { LaunchBannerCta } from "./LaunchBannerCta";

export type LaunchBannerProps = {
  /** Localized base, e.g. `/en/ca` — CTA links to `${basePath}/onboarding`. */
  basePath: string;
};

/** Baseline strip for Suspense fallback (no async). */
export function LaunchBannerStatic() {
  return (
    <div className="bg-black px-3 py-3 text-center text-sm text-white" role="status">
      <span aria-hidden>🚀 </span>
      Launching soon — join the first {EARLY_USER_CAP} users
    </div>
  );
}

/**
 * Top-of-funnel launch strip: early spots + CTA to onboarding (recommendation-only; analytics only).
 * Wrap in `Suspense` with {@link LaunchBannerStatic}; respect `flags.RECOMMENDATIONS` for static-only.
 */
export async function LaunchBanner({ basePath }: LaunchBannerProps) {
  const launchMode = await isPlatformLaunchRunning();
  if (!flags.RECOMMENDATIONS && !launchMode) {
    return <LaunchBannerStatic />;
  }

  const onboardingHref = `${basePath.replace(/\/$/, "")}/onboarding`;
  let currentUsers = 0;
  try {
    currentUsers = await getEarlyUserCountCached();
  } catch {
    return <LaunchBannerStatic />;
  }

  const remaining = Math.max(0, EARLY_USER_CAP - Math.floor(currentUsers));
  const { cta, message } = launchBannerCtaLabel(remaining);
  const rawUrgency = getLaunchBannerUrgency(remaining);
  const urgency: "none" | "accent" | "critical" = launchMode
    ? "critical"
    : rawUrgency;

  void trackEvent("launch_banner_shown", { remaining, launchMode }).catch(() => {});

  return (
    <div
      className={cn(
        "bg-black px-3 py-3 text-sm text-white",
        "flex flex-col gap-0",
        (urgency === "accent" || urgency === "critical") && "launch-banner-subtle-pulse",
        launchMode && "ring-2 ring-amber-500/50",
        !launchMode && urgency === "accent" && "border-b border-amber-500/50 ring-1 ring-amber-500/30 shadow-[0_0_0_1px_rgba(245,158,11,0.15)]",
        !launchMode &&
          urgency === "critical" &&
          "border-b-2 border-amber-500/60 ring-1 ring-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]",
        launchMode &&
          "border-b-2 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.12)]"
      )}
      role="status"
    >
      {launchMode ? (
        <p className="w-full border-b border-amber-500/30 bg-amber-950/30 px-2 py-1.5 text-center text-xs font-semibold text-amber-200">
          Launch mode active
        </p>
      ) : null}
      <div className="mt-0 flex w-full flex-wrap items-center justify-center gap-3 text-center sm:mt-0">
      <p className="min-w-0 flex-1 text-balance sm:flex-[1_1_auto]">
        {urgency === "critical" && !launchMode ? (
          <>
            <span aria-hidden className="mr-1">
              🔥
            </span>
            <span className="sr-only">Almost full. </span>
            <span className="font-medium">Almost full —</span>{" "}
          </>
        ) : (
          <span aria-hidden>🚀 </span>
        )}
        {message}
      </p>
      <LaunchBannerCta href={onboardingHref} remaining={remaining}>
        {cta}
      </LaunchBannerCta>
      </div>
    </div>
  );
}
