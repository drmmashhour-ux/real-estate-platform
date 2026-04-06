import Link from "next/link";
import type { HubTheme } from "@/lib/hub/themes";
import { HUB_GOLD_CSS } from "./hub-tokens";

type HubListingCardProps = {
  title: string;
  subtitle?: string;
  href: string;
  imageUrl?: string | null;
  meta?: string;
  theme?: HubTheme;
};

export function HubListingCard({ title, subtitle, href, imageUrl, meta, theme }: HubListingCardProps) {
  const accent = theme?.accent ?? HUB_GOLD_CSS;
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/25 transition hover:border-white/20"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external listing URLs vary; avoid remotePatterns churn
          <img src={imageUrl} alt="" className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/40">No image</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white" style={{ color: accent }}>
          {title}
        </h3>
        {subtitle ? <p className="mt-1 line-clamp-2 text-sm text-white/70">{subtitle}</p> : null}
        {meta ? <p className="mt-2 text-xs font-medium uppercase tracking-wide text-white/50">{meta}</p> : null}
      </div>
    </Link>
  );
}
