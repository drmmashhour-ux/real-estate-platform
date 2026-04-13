import Link from "next/link";
import TrustedBrokerCard from "@/components/fsbo/TrustedBrokerCard";
import { CONTACT_EMAIL } from "@/lib/config/contact";

export default function FsboLearnPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-14 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/sell" className="text-sm text-premium-gold">
          ← FSBO listings
        </Link>
        <h1 className="mt-6 text-3xl font-semibold">Sell your property yourself</h1>
        <p className="mt-4 text-[#B3B3B3]">
          List your home for sale by owner (FSBO) on LECIPM. You keep control of pricing, showings, and
          negotiation. We charge a one-time publish fee so your listing appears in our FSBO directory — buyers
          contact you directly.
        </p>

        <section className="mt-12 border-t border-white/10 pt-10" aria-labelledby="learn-trusted-broker-heading">
          <h2 id="learn-trusted-broker-heading" className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-premium-gold">
            Or work with a trusted broker
          </h2>
          <div className="mt-8">
            <TrustedBrokerCard
              name="Mohamed Al Mashhour"
              title="Residential Real Estate Broker"
              licenseNumber="J1321"
              image="/images/broker.jpg"
              email={CONTACT_EMAIL}
              consultationHref="/sell#sell-consultation"
            />
          </div>
        </section>

        <ul className="mt-8 list-disc space-y-3 pl-6 text-[#B3B3B3]">
          <li>Create a draft, add photos via secure URLs, and publish when ready.</li>
          <li>Stripe checkout for a flat publish fee (see create page for current pricing).</li>
          <li>Property must meet local regulations — you are responsible for accurate disclosures.</li>
          <li>BNHUB short-term rentals and other hubs are unchanged; this module is for private sales only.</li>
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/sell/create"
            className="rounded-xl bg-premium-gold px-6 py-3 text-sm font-bold text-[#0B0B0B] hover:bg-premium-gold"
          >
            Create your listing
          </Link>
          <Link href="/contact" className="rounded-xl border border-white/20 px-6 py-3 text-sm text-white">
            Questions? Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
