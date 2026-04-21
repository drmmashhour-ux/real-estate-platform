import type { ReactNode } from "react";

import DashboardLayout from "@/components/lecipm-ui/dashboard-layout";

/** LECIPM broker console — premium shell under `/dashboard/lecipm`. */
export default function LecipmConsoleLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
