import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getApprovedHost, hasAcceptedHostAgreement } from "@/lib/bnhub/host";
import { NBHUB_SHORT_TERM_RENTAL_AGREEMENT_HTML } from "@/lib/bnhub/nbhub-short-term-rental-agreement";
import { HostAgreementAcceptForm } from "./host-agreement-accept-form";

const agreementBodyClassName =
  "text-sm text-slate-800 [&_h2]:mt-6 [&_h2]:scroll-mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2:first-child]:mt-0 [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-900 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1 [&_ul_ul]:mt-1";

export default async function HostAgreementPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/bnhub/login");

  const host = await getApprovedHost(userId);
  if (!host) redirect("/bnhub/become-host");

  const accepted = await hasAcceptedHostAgreement(host.id);
  if (accepted) redirect("/dashboard/bnhub/host");

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/search/bnhub" className="text-lg font-semibold text-slate-900">
            BNHub
          </Link>
          <Link
            href="/dashboard/bnhub/host"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">BNHub short-term rental agreement</h1>
        <p className="mt-2 text-slate-600">
          You must accept this agreement before creating, publishing, or managing short-term rental listings on BNHub.
        </p>

        <div className="mt-8 max-h-[min(70vh,56rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
          <div
            className={agreementBodyClassName}
            dangerouslySetInnerHTML={{ __html: NBHUB_SHORT_TERM_RENTAL_AGREEMENT_HTML }}
          />
        </div>

        <HostAgreementAcceptForm hostId={host.id} />
      </section>
    </main>
  );
}
