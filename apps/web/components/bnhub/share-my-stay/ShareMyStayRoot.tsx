"use client";

import { type ReactNode } from "react";
import { ShareMyStayContext, type ShareMyStayContextValue } from "./ShareMyStayContext";
import { useShareMyStayController } from "./useShareMyStayController";

export function ShareMyStayRoot({
  bookingId,
  checkOutIso,
  children,
}: {
  bookingId: string;
  checkOutIso: string;
  children: ReactNode;
}) {
  const c = useShareMyStayController({ bookingId, checkOutIso });

  const value: ShareMyStayContextValue = {
    bookingId: c.bookingId,
    active: c.active,
    session: c.session,
    remainingMs: c.remainingMs,
    shareUrl: c.shareUrl,
    busy: c.busy,
    modalOpen: c.modalOpen,
    setModalOpen: c.setModalOpen,
    successOpen: c.successOpen,
    setSuccessOpen: c.setSuccessOpen,
    stopDialogOpen: c.stopDialogOpen,
    setStopDialogOpen: c.setStopDialogOpen,
    extendModalOpen: c.extendModalOpen,
    setExtendModalOpen: c.setExtendModalOpen,
    openStartModal: c.openStartModal,
    openManage: c.openManage,
    copyShareLink: c.copyShareLink,
    stopSession: c.stopSession,
    extendSession: c.extendSession,
    manualLocationPing: c.manualLocationPing,
    startSession: c.startSession,
    checkoutLabel: c.checkoutLabel,
  };

  return <ShareMyStayContext.Provider value={value}>{children}</ShareMyStayContext.Provider>;
}
