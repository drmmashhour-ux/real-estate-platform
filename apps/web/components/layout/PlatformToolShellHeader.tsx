import Link from "next/link";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";

type PlatformToolShellHeaderProps = {
  title: string;
  subtitle?: string;
  /** Shown under the gold eyebrow; default matches ToolShell legacy copy. */
  eyebrow?: string;
  /** Right side (e.g. “← Home” link). */
  rightSlot?: React.ReactNode;
};

/**
 * Top bar for public tool pages — same logo, gold accent, and shell as {@link HubLayout} headers.
 */
export function PlatformToolShellHeader({
  title,
  subtitle,
  eyebrow = "LECIPM",
  rightSlot,
}: PlatformToolShellHeaderProps) {
  return (
    <div className="border-b border-premium-gold/20 bg-[#111111]">
      <div className="h-1 w-full shrink-0 bg-premium-gold/90" aria-hidden />
      <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <LecipmBrandLockup
            href="/"
            variant="dark"
            density="compact"
            logoClassName="[&_img]:max-h-8 sm:[&_img]:max-h-9"
          />
          <div className="min-w-0 border-l border-white/10 pl-0 sm:pl-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold/90">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {rightSlot ?? (
            <Link href="/" className="text-sm font-medium text-premium-gold hover:text-premium-gold-hover">
              ← Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
