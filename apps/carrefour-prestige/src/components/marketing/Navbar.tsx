import Link from "next/link";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand";
import { getPlatformAppUrl } from "@/lib/platform-url";

export function Navbar() {
  const platformUrl = getPlatformAppUrl();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B0B0B]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="max-w-[min(100%,280px)] leading-tight text-[#C9A646] md:text-lg">
          <span className="block font-sans text-base font-bold tracking-wide text-white">{PLATFORM_NAME}</span>
          <span className="mt-0.5 block font-serif text-xs font-normal text-[#C9A646]/90 md:text-sm">
            {PLATFORM_CARREFOUR_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-[#CCCCCC] md:gap-8">
          <Link href="/properties" className="transition hover:text-white">
            Listings
          </Link>
          <Link href="/login" className="transition hover:text-white">
            Login
          </Link>
          <a
            href={platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-lg border border-[#C9A646] px-3 py-1.5 text-[#C9A646] transition hover:bg-[#C9A646]/10 sm:inline-flex"
          >
            Platform ↗
          </a>
          <Link
            href="/register"
            className="rounded-lg bg-[#C9A646] px-4 py-2 font-semibold text-[#0B0B0B] shadow-[0_4px_24px_rgba(201,166,70,0.2)] transition hover:bg-[#b8943d]"
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}
