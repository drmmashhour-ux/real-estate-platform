import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { LeadsCrmClient } from "./leads-crm-client";

export const metadata = {
  title: "Lead CRM",
  description: "Broker CRM for evaluation and platform leads.",
};

export default async function LeadsCrmPage() {
  const id = await getGuestId();
  if (!id) redirect("/login?next=/dashboard/leads");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <LeadsCrmClient isAdmin={user.role === "ADMIN"} />;
}
