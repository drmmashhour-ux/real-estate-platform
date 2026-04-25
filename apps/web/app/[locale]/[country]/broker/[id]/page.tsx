import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@repo/db";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { seoConfig } from "@/lib/seo/config";
import { isBrokerInsuranceValid, getBrokerInsuranceStatus } from "@/modules/compliance/insurance/insurance.service";
import { BrokerTrustBadges } from "@/components/trust/BrokerTrustBadges";
import { TRUST_COPY, isActiveOaciqLicenceOnFile, isIndependentPractice } from "@/lib/trust/broker-trust";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; country: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, country, id } = await params;
  const broker = await prisma.user.findFirst({
    where: { id, role: PlatformRole.BROKER },
    select: { name: true, lecipmBrokerLicenceProfile: { select: { fullName: true } } },
  });
  const label =
    broker?.lecipmBrokerLicenceProfile?.fullName?.trim() || broker?.name?.trim() || "Real estate broker";
  return buildPageMetadata({
    title: `${label} | ${seoConfig.siteName}`,
    description: `Broker profile and regulatory transparency on ${seoConfig.siteName}.`,
    path: `/broker/${id}`,
    locale,
    country,
  });
}

export default async function PublicBrokerProfilePage({ params }: Props) {
  const { locale, country, id } = await params;

  const broker = await prisma.user.findFirst({
    where: { id, role: PlatformRole.BROKER },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      lecipmBrokerLicenceProfile: true,
    },
  });

  if (!broker) notFound();

  const profile = broker.lecipmBrokerLicenceProfile;
  const displayName =
    profile?.fullName?.trim() || broker.name?.trim() || "Real estate broker";
  const licensed = isActiveOaciqLicenceOnFile(profile);
  const insured = await isBrokerInsuranceValid(broker.id);
  const independent = isIndependentPractice(profile);
  const insuranceStatus = await getBrokerInsuranceStatus(broker.id);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-12 text-white">
      <Link
        href={`/${locale}/${country}/listings`}
        className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
      >
        ← Listings
      </Link>
      <h1 className="mt-6 font-serif text-3xl text-white">{displayName}</h1>
      <p className="mt-2 text-sm text-white/60">Real estate broker — Québec</p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-[#0c0c0c] p-5">
        <BrokerTrustBadges
          licensedOaciq={licensed}
          insuredFarcia={insured}
          independentBroker={independent}
          locale={locale}
          brokerUserId={broker.id}
          surface="profile"
          variant="listing"
        />
        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/45">OACIQ licence number</dt>
            <dd className="mt-1 text-white/90">{profile?.licenceNumber?.trim() || "—"}</dd>
            {profile?.licenceStatus ? (
              <dd className="mt-1 text-xs text-white/50">Status on file: {profile.licenceStatus}</dd>
            ) : null}
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
              Professional liability (FARCIQ)
            </dt>
            <dd className="mt-1 text-white/90">{insuranceStatus.message}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Contact</dt>
            <dd className="mt-1 space-y-1 text-white/90">
              {broker.email ? (
                <p>
                  Email:{" "}
                  <a className="text-[#D4AF37] hover:text-[#E8D589]" href={`mailto:${broker.email}`}>
                    {broker.email}
                  </a>
                </p>
              ) : null}
              {broker.phone ? <p>Phone: {broker.phone}</p> : null}
              {!broker.email && !broker.phone ? <p className="text-white/50">Contact via listing inquiries.</p> : null}
            </dd>
          </div>
        </dl>
        <p className="mt-6 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-white/50">
          {TRUST_COPY.platformNotRegulator}
        </p>
      </div>
    </main>
  );
}
