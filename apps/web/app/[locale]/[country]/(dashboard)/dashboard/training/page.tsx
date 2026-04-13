import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { TrainingHubClient } from "./training-client";

export const metadata = {
  title: "Sales training",
  description: "Scripts, objections, and closing practice for brokers.",
};

export default async function TrainingPage() {
  const id = await getGuestId();
  if (!id) redirect("/login?next=/dashboard/training");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (user?.role !== "BROKER" && user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <TrainingHubClient />;
}
