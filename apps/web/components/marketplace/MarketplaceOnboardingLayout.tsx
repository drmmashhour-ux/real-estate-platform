import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

export function MarketplaceOnboardingLayout({ title, description, children }: Props) {
  return (
    <main className="min-h-screen bg-black px-4 py-16 lg:py-24 text-white font-sans selection:bg-[#D4AF37] selection:text-black">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(212,175,55,0.08),transparent_70%)]" />
      
      <div className="relative mx-auto max-w-2xl">
        <Link 
          href="/dashboard" 
          className="group inline-flex items-center gap-2 text-[10px] font-black text-zinc-500 hover:text-[#D4AF37] uppercase tracking-[0.3em] transition-all"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Dashboard
        </Link>
        
        <div className="mt-10 mb-12 space-y-4">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-[0.9]">
            {title}
          </h1>
          <div className="h-1 w-20 bg-[#D4AF37]" />
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed max-w-lg">
            {description}
          </p>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 rounded-[3rem] p-8 lg:p-12 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {children}
        </div>

        {/* Phase 9: Trust Mini-footer */}
        <div className="mt-12 flex items-center justify-center gap-8 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white">SECURE</div>
          <div className="w-1 h-1 bg-zinc-800 rounded-full" />
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white">QUÉBEC REGULATED</div>
          <div className="w-1 h-1 bg-zinc-800 rounded-full" />
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white">ENCRYPTED</div>
        </div>
      </div>
    </main>
  );
}
