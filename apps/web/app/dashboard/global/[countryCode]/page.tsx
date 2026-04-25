import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getCountryConfig } from "@/modules/global-expansion/global-country.service";
import { GlobalCountryDetailClient } from "@/modules/global-expansion/components/GlobalCountryDetailClient";

type Props = { params: Promise<{ countryCode: string }> };

export async function generateMetadata({ params }: Props) {
  const { countryCode } = await params;
  const c = getCountryConfig(countryCode);
  return { title: c ? `${c.name} — Global market | LECIPM` : "Market | LECIPM" };
}

export default async function GlobalCountryDetailPage({ params }: Props) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/dashboard/global");

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (me?.role !== PlatformRole.ADMIN) {
    redirect("/dashboard/admin/command-center");
  }

  const { countryCode } = await params;
  if (!getCountryConfig(countryCode)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-6 py-3 text-sm">
        <Link href="/dashboard/global" className="text-amber-400/90 hover:underline">
          ← Global markets
        </Link>
        <span className="ml-2 text-zinc-600">/{countryCode.toUpperCase()}</span>
      </div>
      <GlobalCountryDetailClient countryCode={countryCode} adminBase="/dashboard" />
    </div>
  );
}
