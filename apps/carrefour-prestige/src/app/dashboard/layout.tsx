import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#030712]">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        <div className="flex-1 p-6 text-emerald-50">{children}</div>
      </div>
    </div>
  );
}
