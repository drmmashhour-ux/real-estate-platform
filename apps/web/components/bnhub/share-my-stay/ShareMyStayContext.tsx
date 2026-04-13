"use client";

import { createContext, useContext } from "react";
import type { DurationChoice, ExtendPreset, ModeChoice, ShareSessionInfo } from "./types";

export type ShareMyStayContextValue = {
  bookingId: string;
  active: boolean;
  session: ShareSessionInfo | null;
  remainingMs: number;
  shareUrl: string | null;
  busy: boolean;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  successOpen: boolean;
  setSuccessOpen: (open: boolean) => void;
  stopDialogOpen: boolean;
  setStopDialogOpen: (open: boolean) => void;
  extendModalOpen: boolean;
  setExtendModalOpen: (open: boolean) => void;
  openStartModal: () => void;
  openManage: () => void;
  copyShareLink: () => Promise<void>;
  stopSession: () => Promise<void>;
  extendSession: (preset: ExtendPreset) => Promise<void>;
  manualLocationPing: () => void;
  startSession: (params: {
    contactLabel: string;
    shareMethod: "email" | "link";
    recipientEmail: string;
    duration: DurationChoice;
    mode: ModeChoice;
  }) => Promise<void>;
  checkoutLabel: string;
};

const ShareMyStayContext = createContext<ShareMyStayContextValue | null>(null);

export function useShareMyStayOptional() {
  return useContext(ShareMyStayContext);
}

export function useShareMyStay() {
  const ctx = useContext(ShareMyStayContext);
  if (!ctx) throw new Error("useShareMyStay must be used within ShareMyStayRoot");
  return ctx;
}

export { ShareMyStayContext };
