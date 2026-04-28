"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

/**
 * Brand 404 inside locale/country — keeps navigation in the selected market.
 */
export default function CountryNotFound() {
  const pathname = usePathname() ?? "";
  const parts = pathname.split("/").filter(Boolean);
  const locale = parts[0] ?? "en";
  const country = parts[1] ?? "uae";
  const home = `/${locale}/${country}`;

  return (
    <div className="min-h-[50vh] bg-[#0b0b0b] py-16">
      <Container className="max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">404</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-white sm:text-4xl">Page not found</h1>
        <p className="mt-4 text-premium-text-muted">
          That URL doesn&apos;t exist or may have moved. Continue from your market home below.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button variant="goldPrimary" asChild>
            <Link href={home}>Back to market home</Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}
