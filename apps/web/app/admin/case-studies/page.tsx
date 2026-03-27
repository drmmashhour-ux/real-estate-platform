import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { CaseStudiesAdminClient } from "./case-studies-admin-client";

export default async function AdminCaseStudiesPage() {
  const id = await getGuestId();
  if (!id) redirect("/login?next=/admin/case-studies");
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/admin");
  return <CaseStudiesAdminClient />;
}
