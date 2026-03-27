import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { hasAcceptedRequired, getRequiredAcceptancesForUser } from "@/lib/legal/acceptance";
import { LEGAL_PATHS } from "@/lib/legal/constants";
import Link from "next/link";
import { AcceptLegalForm } from "./accept-legal-form";

export default async function LegalAcceptPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/bnhub/login");

  const accepted = await hasAcceptedRequired(userId, "platform");
  if (accepted) redirect("/");

  const statuses = await getRequiredAcceptancesForUser(userId, "platform");
  const toAccept = statuses.filter((s) => s.mustAccept);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <h1 className="text-xl font-semibold text-slate-900">
            Accept required documents
          </h1>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-slate-600">
          To continue using the platform, please read and accept the following:
        </p>
        <ul className="mt-4 space-y-2">
          {toAccept.map((s) => (
            <li key={s.documentType} className="flex items-center gap-2">
              <span className="font-medium capitalize text-slate-800">
                {s.documentType.replace(/_/g, " ")}
              </span>
              <Link
                href={LEGAL_PATHS[s.documentType] ?? "/legal/terms"}
                className="text-sm text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read
              </Link>
            </li>
          ))}
        </ul>
        <AcceptLegalForm statuses={toAccept} />
      </div>
    </main>
  );
}
