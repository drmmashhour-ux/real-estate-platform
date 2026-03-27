"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { DemoProviderInner } from "@/components/demo/demo-context";
import { DemoGuidedStartButton } from "@/components/demo/DemoGuidedStartButton";
import { DemoLaunchButton } from "@/components/demo/DemoLaunchButton";
import { DemoOverlay } from "@/components/demo/DemoOverlay";
import { isDemoTourRuntimeEnabled } from "@/lib/demo/demo-env";

export { useDemo } from "@/components/demo/demo-context";

export function DemoProvider({ children }: { children: ReactNode }) {
  const staging = isDemoTourRuntimeEnabled();
  return (
    <Suspense fallback={<>{children}</>}>
      <DemoProviderInner>
        {children}
        {staging ? <DemoGuidedStartButton /> : null}
        {staging ? <DemoLaunchButton /> : null}
        {staging ? <DemoOverlay /> : null}
      </DemoProviderInner>
    </Suspense>
  );
}
