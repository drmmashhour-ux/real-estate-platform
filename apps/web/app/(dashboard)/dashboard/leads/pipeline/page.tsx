import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SalesPipelineBoardClient } from "./pipeline-board-client";

export const metadata = {
  title: "Sales pipeline",
  description: "Drag leads across your closing pipeline.",
};

export default async function SalesPipelinePage() {
  const id = await getGuestId();
  if (!id) redirect("/login?next=/dashboard/leads/pipeline");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <SalesPipelineBoardClient />;
}
