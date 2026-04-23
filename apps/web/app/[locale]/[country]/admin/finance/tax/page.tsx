import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { isFinancialStaff } from "@/lib/admin/finance-access";
import { TaxDocumentsClient } from "./tax-documents-client";
import { TaxDocumentRow } from "./tax-document-row";

export const dynamic = "force-dynamic";

type SearchParams = {
  year?: string;
  status?: string;
  documentType?: string;
  q?: string;
};

export default async function AdminFinanceTaxPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!isFinancialStaff(user?.role)) redirect("/");

  const params = (await searchParams) ?? {};
  const year = params.year ? parseInt(params.year, 10) : undefined;
  const docStatus = params.status?.trim() || undefined;
  const documentType = params.documentType?.trim() || undefined;
  const q = params.q?.trim() || undefined;

  const docs = await prisma.taxDocument.findMany({
    where: {
      ...(year != null && !Number.isNaN(year) ? { periodYear: year } : {}),
      ...(docStatus ? { status: docStatus } : {}),
      ...(documentType ? { documentType } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { documentType: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 120,
    include: {
      subjectUser: { select: { email: true, name: true } },
      generatedBy: { select: { email: true } },
    },
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/admin/finance" className="text-sm text-amber-400 hover:text-amber-300">
          ← Financial dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Tax & accounting documents</h1>
        <p className="mt-2 text-sm text-slate-400">
          Internal summaries only — not official government forms. A CPA must validate compliance (e.g. GST/QST).
        </p>

        <TaxDocumentsClient />

        <form className="mt-8 flex flex-wrap items-end gap-3" method="get">
          <div>
            <label className="block text-xs text-slate-500">Tax year</label>
            <input type="number" name="year" className="input-premium mt-1 w-28" placeholder="e.g. 2025" defaultValue={params.year ?? ""} />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Status</label>
            <select name="status" className="input-premium mt-1" defaultValue={params.status ?? ""}>
              <option value="">Any</option>
              <option value="active">active</option>
              <option value="void">void</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500">Document type</label>
            <input name="documentType" className="input-premium mt-1" placeholder="e.g. ANNUAL_EARNINGS_SUMMARY" defaultValue={params.documentType ?? ""} />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Keyword</label>
            <input name="q" className="input-premium mt-1" placeholder="Title search" defaultValue={params.q ?? ""} />
          </div>
          <button type="submit" className="btn-primary">
            Filter
          </button>
        </form>

        <h2 className="mt-10 text-lg font-medium text-slate-200">Generated documents</h2>
        <ul className="mt-4 space-y-3">
          {docs.map((d) => (
            <TaxDocumentRow
              key={d.id}
              id={d.id}
              title={d.title}
              documentType={d.documentType}
              createdAt={d.createdAt.toISOString()}
              subjectEmail={d.subjectUser?.email}
            />
          ))}
        </ul>
        {docs.length === 0 && <p className="mt-4 text-sm text-slate-500">No documents match filters.</p>}
      </div>
    </main>
  );
}
