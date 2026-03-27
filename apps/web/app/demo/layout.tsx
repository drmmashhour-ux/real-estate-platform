import { MvpNav } from "@/components/investment/MvpNav";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-50">
      <MvpNav variant="demo" />
      {children}
    </div>
  );
}
