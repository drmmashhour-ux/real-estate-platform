"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

/**
 * Catches runtime errors beneath the country chrome (listings, BNHub, dashboards).
 */
export default function CountryRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname() ?? "";
  const [, locale = "en", country = "uae"] = pathname.split("/");
  const home = `/${locale}/${country}`;

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-[#0b0b0b] px-4 py-16">
      <Container narrow className="text-center">
        <div className="rounded-[var(--ds-radius-xl)] border border-white/10 bg-[#121212] p-8 shadow-[0_0_40px_rgba(212,175,55,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Error</p>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-white sm:text-3xl">This section failed to load</h2>
          <p className="mt-3 text-sm text-premium-text-muted">{error.message}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button type="button" variant="goldPrimary" onClick={() => reset()}>
              Try again
            </Button>
            <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
              <Link href={home}>Home</Link>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
