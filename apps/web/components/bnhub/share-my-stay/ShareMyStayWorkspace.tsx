"use client";

import { ExtendShareSessionModal } from "./ExtendShareSessionModal";
import { ShareMyStayBanner } from "./ShareMyStayBanner";
import { ShareMyStayModal } from "./ShareMyStayModal";
import { ShareMyStaySection } from "./ShareMyStaySection";
import { ShareMyStaySuccessState } from "./ShareMyStaySuccessState";
import { StopShareSessionDialog } from "./StopShareSessionDialog";

/** Guest UI: banner, main card, and all modals. Use inside ShareMyStayRoot. */
export function ShareMyStayWorkspace() {
  return (
    <>
      <ShareMyStayBanner />
      <ShareMyStaySection />
      <ShareMyStayModal />
      <ShareMyStaySuccessState />
      <StopShareSessionDialog />
      <ExtendShareSessionModal />
    </>
  );
}
