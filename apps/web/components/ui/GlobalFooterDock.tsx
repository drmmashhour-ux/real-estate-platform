"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getAssistantConfig } from "@/lib/ai/assistant-config";
import { getContactTelHref, getContactWhatsAppUrl } from "@/lib/config/contact";
import { useFooterHistoryNavSuppressed } from "@/components/layout/FooterHistoryNavContext";
import { FooterHistoryNavPair } from "@/components/layout/FooterHistoryNavPair";
import { isMarketingHomePath } from "@/lib/layout/marketing-home";
import { isInvestmentShellPath } from "@/lib/product-focus";

const LISTINGS_HUB_SEGMENTS = new Set(["saved", "top", "luxury", "affordable"]);

function isPublicListingDetailPath(pathname: string): boolean {
  if (!pathname.startsWith("/listings/")) return false;
  const segments = pathname.slice("/listings/".length).split("/").filter(Boolean);
  if (segments.length !== 1) return false;
  return !LISTINGS_HUB_SEGMENTS.has(segments[0]);
}

const iconBtn =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:h-12 sm:w-12";

/**
 * Single bottom dock: browser Back/Continue + Call, WhatsApp, chat menu (Immo AI + platform assistant), Feedback.
 * Desktop: Back/Continue also appears in the document footer (see FooterClient) — not duplicated at the same breakpoint.
 * Platform assistant no longer uses a second floating bubble (see PlatformAssistant).
 */
export function GlobalFooterDock() {
  const pathname = usePathname() ?? "";
  const historyNavSuppressed = useFooterHistoryNavSuppressed();
  const assistantCfg = getAssistantConfig();
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const chatMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!chatMenuRef.current?.contains(e.target as Node)) setChatMenuOpen(false);
    }
    if (chatMenuOpen) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
  }, [chatMenuOpen]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/embed")) {
    return null;
  }

  if (isMarketingHomePath(pathname)) {
    return null;
  }

  /** Mobile investment shell: Back/Continue are in `InvestmentMobileBottomNav` (z-index above this dock). */
  const investmentShell = isInvestmentShellPath(pathname);
  const showHistoryInDock = !historyNavSuppressed && !investmentShell;

  /** Matches FloatingContact: hide call/WhatsApp on public listing detail only. */
  const isListingDetail = isPublicListingDetailPath(pathname);
  const isAuth = pathname.startsWith("/auth");
  const showPhoneWa = !isListingDetail;
  const showFeedbackBtn = !isAuth;

  const telHref = getContactTelHref();
  const waHref = getContactWhatsAppUrl();

  function toggleImmoChat() {
    window.dispatchEvent(new CustomEvent("lecipm-immo-chat-toggle"));
  }

  function togglePlatformAssistant() {
    window.dispatchEvent(new CustomEvent("lecipm-platform-assistant-toggle"));
  }

  function onChatLauncherClick() {
    if (!assistantCfg.assistantEnabled) {
      toggleImmoChat();
      return;
    }
    setChatMenuOpen((o) => !o);
  }

  function openFeedback() {
    window.dispatchEvent(new CustomEvent("lecipm-open-feedback", { detail: { reason: "manual" } }));
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-2 sm:px-4"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div
        className={`pointer-events-auto flex w-full max-w-3xl items-center gap-2 rounded-2xl border border-white/12 bg-[#0B0B0B]/95 px-2 py-2 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:gap-3 sm:px-4 ${
          showHistoryInDock ? "justify-between lg:justify-end" : "justify-end"
        }`}
        role="toolbar"
        aria-label="Quick navigation and contact"
      >
        {showHistoryInDock ? (
          <div className="shrink-0 lg:hidden">
            <FooterHistoryNavPair variant="segmented" />
          </div>
        ) : null}

        <div className="flex items-center gap-1.5 sm:gap-2" aria-label="Contact and help">
          {showPhoneWa && telHref ? (
            <a
              href={telHref}
              className={`${iconBtn} bg-premium-gold text-[#0B0B0B] focus-visible:outline-premium-gold`}
              aria-label="Call us"
              title="Call"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>
          ) : null}

          {showPhoneWa ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${iconBtn} bg-[#25D366] text-white focus-visible:outline-[#25D366]`}
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          ) : null}

          <div className="relative" ref={chatMenuRef}>
            <button
              type="button"
              onClick={onChatLauncherClick}
              className={`${iconBtn} border-2 border-premium-gold/55 bg-[#121212] text-premium-gold focus-visible:outline-premium-gold`}
              style={{ color: "var(--color-premium-gold)" }}
              aria-label={
                assistantCfg.assistantEnabled ? "Open chat options — Immo AI or search assistant" : "Open Immo AI chat"
              }
              aria-expanded={assistantCfg.assistantEnabled ? chatMenuOpen : undefined}
              aria-haspopup={assistantCfg.assistantEnabled ? "menu" : undefined}
              title={assistantCfg.assistantEnabled ? "Chats" : "Immo AI chat"}
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {assistantCfg.assistantEnabled && chatMenuOpen ? (
              <div
                role="menu"
                className="absolute bottom-[calc(100%+10px)] right-0 z-[60] min-w-[12.5rem] rounded-xl border border-white/15 bg-[#121212] py-1 shadow-[0_-12px_40px_rgba(0,0,0,0.5)]"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2.5 text-left text-sm text-white hover:bg-white/10"
                  onClick={() => {
                    toggleImmoChat();
                    setChatMenuOpen(false);
                  }}
                >
                  Immo AI
                  <span className="block text-[10px] font-normal text-slate-500">Real estate Q&amp;A</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-2.5 text-left text-sm text-white hover:bg-white/10"
                  onClick={() => {
                    togglePlatformAssistant();
                    setChatMenuOpen(false);
                  }}
                >
                  LECIPM Assistant
                  <span className="block text-[10px] font-normal text-slate-500">Search, stays, platform help</span>
                </button>
              </div>
            ) : null}
          </div>

          {showFeedbackBtn ? (
            <button
              type="button"
              onClick={openFeedback}
              className={`${iconBtn} border border-amber-500/40 bg-amber-600/90 text-white hover:bg-amber-500 focus-visible:outline-amber-400`}
              aria-label="Send feedback"
              title="Feedback"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
