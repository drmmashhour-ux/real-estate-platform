import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { getSession } from "@/lib/auth/get-session";
import { AdminAgencyRegistryTransactionsClient } from "./AdminAgencyRegistryTransactionsClient";

export default async function AdminFinancialTransactionsPage() {
  const { user } = await getSession();
  if (!user || user.role !== PlatformRole.ADMIN) {
    redirect("/");
  }
  return <AdminAgencyRegistryTransactionsClient />;
}
