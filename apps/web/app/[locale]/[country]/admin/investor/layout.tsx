import { InvestorHubNav } from "@/components/investor-hub/InvestorHubNav";

export default function AdminInvestorSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <InvestorHubNav />
      {children}
      <footer className="border-t border-amber-900/20 py-6">
        <p className="text-center text-[10px] font-medium tracking-[0.2em] text-amber-800/70">
          LECIPM INVESTOR · ADMIN ONLY
        </p>
      </footer>
    </div>
  );
}
