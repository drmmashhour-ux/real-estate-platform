import { redirect } from "next/navigation";
import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { getHubTheme } from "@/lib/hub/themes";
import { BrokerTaxForm } from "./broker-tax-form";

export const dynamic = "force-dynamic";

export default async function BrokerTaxInformationPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    redirect("/dashboard/broker");
  }

  const theme = getHubTheme("broker");

  return (
    <HubLayout title="Tax information" hubKey="broker" navigation={hubNavigation.broker} showAdminInSwitcher={false}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link href="/dashboard/broker" className="text-sm text-emerald-400 hover:text-emerald-300">
            ← Broker dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-semibold" style={{ color: theme.accent }}>
            Tax information (Canada / Quebec)
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Provide your BN, GST, and QST registration numbers for invoices and commission records. Numbers are stored securely and
            reviewed internally only.
          </p>
        </div>
        <BrokerTaxForm />
      </div>
    </HubLayout>
  );
}
