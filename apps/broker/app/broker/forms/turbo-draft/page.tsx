import { PlatformRole } from "@prisma/client";
import { getSession } from "@/lib/auth/get-session";
import { TurboDraftForm } from "@/components/turbo-draft/TurboDraftForm";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TurboDraftPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { user } = await getSession();
  if (!user || user.role !== PlatformRole.BROKER) {
    redirect("/login");
  }

  const sp = await searchParams;
  const formKey = sp.type || "PROMISE_TO_PURCHASE";

  return (
    <div className="min-h-screen bg-black p-8 sm:p-12">
      <div className="mx-auto max-w-7xl space-y-12">
        <header className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-premium-gold">Compliance-First Drafting</p>
            <h1 className="mt-2 text-4xl font-black tracking-tighter text-white italic">Turbo Draft Engine</h1>
          </div>
          <Link 
            href="/dashboard/broker/forms"
            className="text-xs font-black uppercase tracking-widest text-neutral-500 hover:text-premium-gold transition-colors"
          >
            ← Return to Forms Hub
          </Link>
        </header>

        <TurboDraftForm formKey={formKey} />
      </div>
    </div>
  );
}
