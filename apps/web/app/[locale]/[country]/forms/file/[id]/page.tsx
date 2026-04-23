import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@repo/db";
import { PrintPageButton } from "@/components/ui/PrintPageButton";
import { ClientSignatureActions } from "./client-signature-actions";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function ClientFormFilePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const submission = await prisma.formSubmission.findUnique({
    where: { id },
  });

  if (!submission) notFound();

  const payload = (submission.payloadJson ?? {}) as Record<string, unknown>;
  const payloadEntries = Object.entries(payload).filter(([key]) => !key.startsWith("_"));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm text-amber-400 hover:text-amber-300">
            ← Platform
          </Link>
          <PrintPageButton label="Print client file" />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
            Client file
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            {submission.formType.replace(/[-_]/g, " ")}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Reference `{submission.id}` · Status `{submission.status}`
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Client</p>
              <p className="mt-2 text-sm text-slate-100">{submission.clientName || "Not set yet"}</p>
              <p className="mt-1 text-sm text-slate-400">{submission.clientEmail || "No email on file"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Timeline</p>
              <p className="mt-2 text-sm text-slate-100">
                Created {new Date(submission.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Updated {new Date(submission.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-slate-100">Saved form data</h2>
          <div className="mt-4 space-y-3">
            {payloadEntries.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{key.replace(/_/g, " ")}</p>
                <p className="mt-2 text-sm text-slate-100">{String(value ?? "")}</p>
              </div>
            ))}
          </div>
        </section>

        <ClientSignatureActions
          submissionId={submission.id}
          initialStatus={submission.status}
          initialClientName={submission.clientName}
        />
      </div>
    </main>
  );
}
