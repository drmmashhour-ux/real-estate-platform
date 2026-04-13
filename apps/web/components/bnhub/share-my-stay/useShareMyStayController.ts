"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import type { DurationChoice, ExtendPreset, ModeChoice, ShareSessionInfo } from "./types";
import { TOKEN_PREFIX } from "./types";

export function useShareMyStayController({
  bookingId,
  checkOutIso,
}: {
  bookingId: string;
  checkOutIso: string;
}) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<ShareSessionInfo | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const watchId = useRef<number | null>(null);
  const expiresAtRef = useRef(0);

  const load = useCallback(async () => {
    const r = await fetch(`/api/share-sessions?bookingId=${encodeURIComponent(bookingId)}`, {
      credentials: "same-origin",
    });
    const j = (await r.json()) as { session?: ShareSessionInfo | null };
    if (!r.ok) {
      setSession(null);
      return;
    }
    setSession(j.session ?? null);
    if (j.session?.id) {
      const stored =
        typeof window !== "undefined" ? window.sessionStorage.getItem(TOKEN_PREFIX + j.session.id) : null;
      if (stored) {
        const base = window.location.origin;
        setShareUrl(`${base}/share/${encodeURIComponent(stored)}`);
      } else {
        setShareUrl(null);
      }
    } else {
      setShareUrl(null);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!session) {
      setRemainingMs(0);
      expiresAtRef.current = 0;
      return;
    }
    const end = new Date(session.expiresAt).getTime();
    expiresAtRef.current = end;
    const tick = () => setRemainingMs(end - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session]);

  const expiredHandled = useRef(false);
  useEffect(() => {
    if (!session || session.status !== "ACTIVE") {
      expiredHandled.current = false;
      return;
    }
    if (remainingMs > 0) {
      expiredHandled.current = false;
      return;
    }
    if (!expiredHandled.current) {
      expiredHandled.current = true;
      showToast("Sharing ended", "info");
      void load();
    }
  }, [session, remainingMs, showToast, load]);

  const stopGeo = useCallback(() => {
    if (watchId.current != null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    watchId.current = null;
  }, []);

  const sendLocation = useCallback(
    (sid: string, lat: number, lng: number, accuracy?: number) => {
      if (Date.now() >= expiresAtRef.current) return;
      void fetch(`/api/share-sessions/${encodeURIComponent(sid)}/location`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lng,
          accuracyMeters: accuracy != null && Number.isFinite(accuracy) ? accuracy : undefined,
        }),
      }).catch(() => {});
    },
    []
  );

  useEffect(() => {
    if (!session?.id || session.status !== "ACTIVE") {
      stopGeo();
      return;
    }
    if (session.shareType !== "LIVE_LOCATION") {
      stopGeo();
      return;
    }
    if (remainingMs <= 0) {
      stopGeo();
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    const sid = session.id;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (Date.now() >= expiresAtRef.current) return;
        sendLocation(sid, pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 25_000 }
    );
    return () => {
      stopGeo();
    };
  }, [session?.id, session?.status, session?.shareType, remainingMs, sendLocation, stopGeo]);

  const startSession = useCallback(
    async (params: {
      contactLabel: string;
      shareMethod: "email" | "link";
      recipientEmail: string;
      duration: DurationChoice;
      mode: ModeChoice;
    }) => {
      if (params.shareMethod === "email") {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.recipientEmail.trim());
        if (!ok) {
          showToast("Enter a valid recipient email, or choose copy link.", "error");
          return;
        }
      }
      setBusy(true);
      try {
        const useEmail = params.shareMethod === "email";
        const r = await fetch("/api/share-sessions", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            duration: params.duration,
            shareType: params.mode,
            recipient: useEmail
              ? {
                  type: "email",
                  value: params.recipientEmail.trim(),
                  displayLabel: params.contactLabel.trim() || undefined,
                }
              : { type: "link_only", displayLabel: params.contactLabel.trim() || "Trusted contact" },
          }),
        });
        const j = (await r.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          sessionId?: string;
          token?: string;
          shareUrl?: string;
          expiresAt?: string;
          warning?: string;
        };
        if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Could not start");
        if (j.token && j.sessionId) {
          try {
            window.sessionStorage.setItem(TOKEN_PREFIX + j.sessionId, j.token);
          } catch {
            /* ignore */
          }
          setShareUrl(j.shareUrl ?? `${window.location.origin}/share/${encodeURIComponent(j.token)}`);
        }
        if (j.warning) showToast(j.warning, "warning");
        setModalOpen(false);
        setSuccessOpen(true);
        await load();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Failed", "error");
      } finally {
        setBusy(false);
      }
    },
    [bookingId, load, showToast]
  );

  const stopSession = useCallback(async () => {
    if (!session?.id) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/share-sessions/${encodeURIComponent(session.id)}/stop`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!r.ok) throw new Error("Stop failed");
      try {
        window.sessionStorage.removeItem(TOKEN_PREFIX + session.id);
      } catch {
        /* ignore */
      }
      stopGeo();
      setShareUrl(null);
      setSession(null);
      setStopDialogOpen(false);
      showToast("Sharing stopped", "success");
      await load();
    } catch {
      showToast("Could not stop sharing.", "error");
    } finally {
      setBusy(false);
    }
  }, [session?.id, load, showToast, stopGeo]);

  const extendSession = useCallback(
    async (preset: ExtendPreset) => {
      if (!session?.id) return;
      setBusy(true);
      try {
        const r = await fetch(`/api/share-sessions/${encodeURIComponent(session.id)}/extend`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preset }),
        });
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Extend failed");
        showToast("Sharing extended", "success");
        setExtendModalOpen(false);
        await load();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Could not extend", "error");
      } finally {
        setBusy(false);
      }
    },
    [session?.id, load, showToast]
  );

  const copyShareLink = useCallback(async () => {
    if (!shareUrl) {
      showToast("No link in this browser. Stop and start again if you cleared storage.", "info");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied", "success");
    } catch {
      showToast("Copy manually or open the link from your browser.", "warning");
    }
  }, [shareUrl, showToast]);

  const manualLocationPing = useCallback(() => {
    if (!session?.id || session.shareType !== "LIVE_LOCATION") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      showToast("Location not supported in this browser.", "warning");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendLocation(session.id, pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        showToast("Location sent", "success");
      },
      () => showToast("Permission denied or unavailable.", "warning"),
      { enableHighAccuracy: false, timeout: 20_000, maximumAge: 0 }
    );
  }, [session, sendLocation, showToast]);

  const active = Boolean(session && session.status === "ACTIVE" && remainingMs > 0);

  const openStartModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const openManage = useCallback(() => {
    document.getElementById("share-my-stay")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const checkoutLabel = useMemo(
    () =>
      new Date(checkOutIso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    [checkOutIso]
  );

  return {
    bookingId,
    active,
    session,
    remainingMs,
    shareUrl,
    busy,
    modalOpen,
    setModalOpen,
    successOpen,
    setSuccessOpen,
    stopDialogOpen,
    setStopDialogOpen,
    extendModalOpen,
    setExtendModalOpen,
    openStartModal,
    openManage,
    copyShareLink,
    stopSession,
    extendSession,
    manualLocationPing,
    startSession,
    load,
    checkoutLabel,
  };
}
