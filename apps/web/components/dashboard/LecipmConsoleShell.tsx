"use client";

import type { ReactNode } from "react";

import type { PlatformRole } from "@prisma/client";

import { CommandCenterSidebar } from "@/components/lecipm-ui/command-center-sidebar";

import { LecipmConsoleAnalytics } from "@/components/dashboard/LecipmConsoleAnalytics";

export function LecipmConsoleShell(props: { children: ReactNode; userRole: PlatformRole }) {
  return (
    <>
      <LecipmConsoleAnalytics variant="lecipm" />
      <div className="flex min-h-screen bg-black">
        <CommandCenterSidebar userRole={props.userRole} />
        <div className="min-h-screen flex-1 overflow-auto px-4 py-6 md:px-8">{props.children}</div>
      </div>
    </>
  );
}
