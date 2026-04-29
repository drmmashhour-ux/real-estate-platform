import Link from "next/link";
import { PLATFORM_COPYRIGHT_LINE } from "@/lib/brand/platform";

const linkCls = "text-[15px] text-neutral-500 transition hover:text-[#C9A96A]/90";

/** Used on `/` (root shell has no FooterClient — country layout renders footer elsewhere). */
export function LandingStandaloneFooter({ basePath }: { basePath: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-neutral-800 bg-black pt-16 pb-20">
      <div className="mx-auto max-w-5xl px-6 sm:px-8">
        <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-20">
          <div className="max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C9A96A]/90">LECIPM</p>
            <p className="mt-6 text-base leading-relaxed text-neutral-500">
              Luxury-grade discovery and analysis—with Québec-market sense.
            </p>
          </div>
          <nav aria-label="Explore" className="flex flex-col gap-5">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600">Explore</span>
            <Link href={`${basePath}/listings`} className={`font-medium text-neutral-400 ${linkCls}`}>
              Listings
            </Link>
            <Link href={`${basePath}/analyze`} className={linkCls}>
              Analyze
            </Link>
          </nav>
          <nav aria-label="Legal" className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600">Legal</span>
            <Link href={`${basePath}/legal/privacy`} className={linkCls}>
              Privacy
            </Link>
            <Link href={`${basePath}/legal/terms`} className={linkCls}>
              Terms
            </Link>
          </nav>
        </div>
        <p className="mt-16 border-t border-neutral-800/80 pt-10 text-center text-sm text-neutral-600 sm:text-left">
          © {year} {PLATFORM_COPYRIGHT_LINE}
        </p>
      </div>
    </footer>
  );
}
