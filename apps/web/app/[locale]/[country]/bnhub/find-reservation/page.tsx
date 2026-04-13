import Link from "next/link";
import { LecipmBrandLockup } from "@/components/brand/LecipmBrandLockup";
import { BnhubGuestNavMenu } from "@/components/bnhub/BnhubGuestNavMenu";
import { FindReservationClient } from "./find-reservation-client";

export default function FindReservationPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-neutral-100">
      <header className="border-b border-premium-gold/20 bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <LecipmBrandLockup href="/bnhub" variant="dark" density="compact" priority />
          <BnhubGuestNavMenu variant="dark" />
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <FindReservationClient />
        <p className="mx-auto mt-8 max-w-md text-center text-xs text-neutral-500">
          For support, reference your confirmation code and{" "}
          <Link href="/support" className="text-premium-gold hover:underline">
            contact us
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
