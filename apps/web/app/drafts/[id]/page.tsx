import { Metadata } from "next";
import { TurboDraftForm } from "@/components/turbo-draft/TurboDraftForm";
import { requireUser } from "@/lib/auth/require-user";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Review Draft | LECIPM",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DraftDetailPage({ params }: Props) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  // @ts-ignore
  const draft = await prisma.turboDraft.findUnique({
    where: { id },
  });

  if (!draft || (draft.userId !== auth.user.id && auth.user.role !== "ADMIN")) {
    notFound();
  }

  const context = draft.contextJson as any;

  return (
    <div className="min-h-screen bg-[#050505] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white sm:text-4xl">
              Modifier le <span className="text-[#D4AF37]">Brouillon</span>
            </h1>
            <p className="mt-2 text-zinc-500">
              Draft ID: {id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "flex h-2 w-2 rounded-full",
              draft.status === "DEAL_CREATED" ? "bg-blue-500" : "bg-emerald-500 animate-pulse"
            )}></span>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Status: {draft.status}
            </span>
          </div>
        </div>

        <TurboDraftForm 
          formKey={draft.formKey} 
          initialInput={context} 
        />
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
