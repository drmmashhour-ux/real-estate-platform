import { redirect, notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { ContractBuilderEditor } from "../ContractBuilderEditor";

export const dynamic = "force-dynamic";

export default async function AdminContractTemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/contracts-builder");
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role !== "ADMIN") redirect("/dashboard");

  const exists = await prisma.contractDraftTemplate.findUnique({ where: { id }, select: { id: true } });
  if (!exists) notFound();

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-[1800px] px-0 sm:px-2">
        <ContractBuilderEditor id={id} />
      </div>
    </main>
  );
}
