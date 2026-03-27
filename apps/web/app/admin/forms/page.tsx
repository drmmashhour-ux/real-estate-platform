import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const OPERATIONAL_FORMS = [
  { id: "controls", label: "Operational controls", description: "Feature flags, kill switches, payout holds." },
  { id: "policies", label: "Policy engine", description: "Policies and decision rules." },
  { id: "property-identities", label: "Property identity console", description: "Property identity management." },
] as const;

const STATUS_COLOR: Record<string, string> = {
  draft: "text-slate-400",
  submitted: "text-amber-400",
  "in-review": "text-blue-400",
  approved: "text-emerald-400",
  rejected: "text-red-400",
  completed: "text-emerald-500",
};

export default async function AdminFormsPage() {
  const submissions = await prisma.formSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Forms</h1>
        <p className="mt-1 text-slate-400">
          Form submissions (OACIQ-style) and operational form tools.
        </p>

        {/* Submissions list */}
        <section className="mt-8">
          <h2 className="text-lg font-medium text-slate-200">Form submissions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Client submissions appear here. Open to review, edit, and change status.
          </p>
          {submissions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500">
              No submissions yet. Clients can submit from{" "}
              <Link href="/forms/amendments" className="text-emerald-400 hover:underline">
                /forms/amendments
              </Link>
              .
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80">
                    <th className="px-4 py-3 font-medium text-slate-300">Form type</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Client</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-300">Created</th>
                    <th className="px-4 py-3 font-medium text-slate-300"></th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id} className="border-b border-slate-800/80 hover:bg-slate-900/50">
                      <td className="px-4 py-3 font-medium text-slate-200">{s.formType}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {s.clientName || "—"}
                        {s.clientEmail && (
                          <span className="block text-xs text-slate-500">{s.clientEmail}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={STATUS_COLOR[s.status] ?? "text-slate-400"}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/forms/${s.id}`}
                          className="rounded bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/30"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Operational forms */}
        <section className="mt-10">
          <h2 className="text-lg font-medium text-slate-200">Operational forms</h2>
          <p className="mt-1 text-sm text-slate-500">
            Feature flags, policies, property identity console.
          </p>
          <ul className="mt-4 space-y-3">
            {OPERATIONAL_FORMS.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/admin/forms/${entry.id}`}
                  className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 hover:bg-slate-900/80"
                >
                  <span className="font-medium text-slate-200">{entry.label}</span>
                  <p className="mt-1 text-sm text-slate-500">{entry.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
