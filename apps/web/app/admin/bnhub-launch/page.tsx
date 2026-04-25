import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BnhubLaunchDashboardClient } from "@/components/bnhub/admin/BnhubLaunchDashboardClient";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { loadBnhubLaunchDashboardRows } from "@/lib/bnhub/bnhub-launch-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BNHub launch — Admin",
  description: "Seed first listings, track hosts and bookings, run launch promotions.",
};

export default async function AdminBnhubLaunchPage() {
  const guestId = await getGuestId();
  if (!guestId) redirect("/en/ca/auth/login?next=/admin/bnhub-launch");
  if (!(await isPlatformAdmin(guestId))) redirect("/");

  const initial = await loadBnhubLaunchDashboardRows();

  return <BnhubLaunchDashboardClient initial={initial} />;
}
