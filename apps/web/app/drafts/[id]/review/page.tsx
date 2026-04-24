import { Metadata } from "next";
import { TurboDraftForm } from "@/components/turbo-draft/TurboDraftForm";
import { requireUser } from "@/lib/auth/require-user";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Broker Review | LECIPM",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BrokerReviewPage({ params }: Props) {
  const auth = await requireUser();
  if (!auth.ok || auth.user.role !== "BROKER") {
    return auth.response;
  }

  const { id } = await params;

  // @ts-ignore
  const draft = await prisma.turboDraft.findUnique({
    where: { id },
  });

  if (!draft) {
    notFound();
  }

  const context = draft.contextJson as any;

  return (
    <div className="min-h-screen bg-[#050505] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white sm:text-4xl">
              Broker <span className="text-[#D4AF37]">Review</span>
            </h1>
            <p className="mt-2 text-zinc-500">
              Draft ID: {id} | Reviewing for {context.parties?.find((p: any) => p.role === "BUYER")?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-[#D4AF37]"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              Broker Review Mode Active
            </span>
          </div>
        </div>

        <TurboDraftForm 
          formKey={draft.formKey} 
          initialInput={{
            ...context,
            role: "BROKER", // Force broker role for review
          }} 
        />
      </div>
    </div>
  );
}
