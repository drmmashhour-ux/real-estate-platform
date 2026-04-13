import Link from "next/link";
import { BnHubLogoMark } from "@/components/bnhub/BnHubLogoMark";
import { BNHUB_LOGO_SRC, BNHUB_MARK_SRC } from "@/lib/brand/bnhub-logo";

/** Public BNHUB guest-surface tagline — header mark + hero. */
export const BNHUB_GUEST_TAGLINE_LINE1 = "Stays · Trips · Travel";
export const BNHUB_GUEST_TAGLINE_LINE2 = "Intelligence";
/** Full line for one-line contexts (accessibility / legacy). */
export const BNHUB_GUEST_TAGLINE = `${BNHUB_GUEST_TAGLINE_LINE1} ${BNHUB_GUEST_TAGLINE_LINE2}`;
/** Subtle reassurance — guest surfaces (hero, landing). */
export const BNHUB_REASSURANCE_LINE = "Trusted by travelers and hosts";

/**
 * BNHUB lockup + tagline for guest surfaces (`/public/branding/bnhub-logo.png`).
 * @param showLogo — Set `false` to show tagline only (no mark beside “Stays · Trips · …”).
 */
export function BnHubHeaderMark({
  size = "header",
  showLogo = true,
}: {
  size?: "header" | "footer";
  showLogo?: boolean;
}) {
  const footer = size === "footer";

  return (
    <Link
      href="/bnhub"
      className={`group flex min-w-0 items-center gap-3 transition-opacity hover:opacity-95 ${footer ? "flex-col gap-3 sm:flex-row sm:items-center" : "flex-wrap sm:flex-nowrap"}`}
    >
      {(footer || showLogo) && (
        <BnHubLogoMark
          src={footer ? BNHUB_LOGO_SRC : BNHUB_MARK_SRC}
          size={footer ? "sm" : "md"}
          priority={!footer}
          className={
            footer
              ? "max-w-[min(100%,240px)]"
              : "max-w-[min(100%,260px)] sm:max-w-[min(100%,300px)] sm:!h-11 opacity-80"
          }
        />
      )}
      <span
        className={`inline-flex max-w-[18rem] flex-col items-center gap-1.5 leading-tight ${footer ? "text-center" : ""}`}
      >
        <span
          className={`w-full text-center font-medium uppercase tracking-[0.18em] text-premium-gold/80 ${footer ? "text-[9px] sm:text-[10px]" : "text-[9px] sm:text-[10px]"}`}
        >
          {BNHUB_GUEST_TAGLINE_LINE1}
        </span>
        <span
          className={`w-full text-center font-serif font-semibold uppercase tracking-[0.26em] text-premium-gold ${footer ? "text-[10px] sm:text-[11px]" : "text-[10px] sm:text-[11px]"}`}
        >
          {BNHUB_GUEST_TAGLINE_LINE2}
        </span>
      </span>
    </Link>
  );
}
