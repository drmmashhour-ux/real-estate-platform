import { redirect } from "next/navigation";
import { PlatformRole } from "@prisma/client";
import { getSession } from "@/lib/auth/get-session";
import { listTransactionRecords } from "@/lib/financial/transaction-records";
import { BrokerRegistryTransactionsClient } from "./BrokerRegistryTransactionsClient";

export default async function BrokerFinancialTransactionsRegistryPage() {
  const { user } = await getSession();
  if (!user) redirect("/login");
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    redirect("/dashboard/broker");
  }

  const initialRows = await listTransactionRecords("solo_broker", user.id);

  return (
    <BrokerRegistryTransactionsClient
      ownerType="solo_broker"
      ownerId={user.id}
      initialRows={initialRows}
    />
  );
}
