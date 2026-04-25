import { Metadata } from "next";
import { LeciSurfaceBootstrap } from "@/components/leci/LeciSurfaceBootstrap";
import { TurboDraftForm } from "@/components/turbo-draft/TurboDraftForm";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "Turbo Form Drafting | LECIPM",
  description: "Generate compliant real estate contracts in minutes.",
};

type Props = {
  searchParams: Promise<{ 
    type?: string; 
    listingId?: string; 
    kind?: "fsbo" | "crm" | "bnhub";
  }>;
};

export default async function TurboDraftPage({ searchParams }: Props) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const params = await searchParams;
  const leciRole = String(auth.user.role).toLowerCase();

  const formKey = params.type || "PROMISE_TO_PURCHASE";

  return (
    <div className="min-h-screen bg-[#050505] py-12">
      <LeciSurfaceBootstrap
        userRole={leciRole}
        draftSummary={`Turbo draft · formulaire ${formKey}`}
        focusTopic={/promise|offre/i.test(formKey) ? "offer_draft" : undefined}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white sm:text-4xl">
              Turbo <span className="text-[#D4AF37]">Draft</span>
            </h1>
            <p className="mt-2 text-zinc-500">
              Génération ultra-rapide de contrats immobiliers conformes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500/80">
              Système de conformité actif
            </span>
          </div>
        </div>

        <TurboDraftForm 
          formKey={formKey} 
          listingId={params.listingId} 
          listingKind={params.kind} 
        />
      </div>
    </div>
  );
}
