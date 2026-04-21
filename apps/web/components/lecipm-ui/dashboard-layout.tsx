import type { ReactNode } from "react";

import { Sidebar, type SidebarNavItem } from "@/components/lecipm-ui/sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
  sidebarItems?: SidebarNavItem[];
  sidebarHeader?: ReactNode;
};

export default function DashboardLayout({ children, sidebarItems, sidebarHeader }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar items={sidebarItems} header={sidebarHeader} />
      <div className="min-h-screen flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
