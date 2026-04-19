"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Globe, MessageCircle, Mic, MicOff, Send, Volume2, X } from "lucide-react";
import { getAssistantConfig } from "@/lib/ai/assistant-config";
import {
  buildPropertySearchHref,
  buildStaySearchHref,
  confirmationLineForProperty,
  confirmationLineForStay,
} from "@/lib/ai/assistant-actions";
import { routeAssistantIntent } from "@/lib/ai/assistant-router";
import { mergeFollowUpSearch, parseSearchIntent } from "@/lib/ai/parseSearchIntent";
import { compareListings } from "@/lib/ai/assistant-compare";
import { trackAssistantEvent } from "@/lib/ai/assistant-analytics";
import { isSpeechRecognitionSupported, startVoiceSearch } from "@/lib/ai/assistantVoice";
import { useVoiceConversation } from "@/lib/ai/useVoiceConversation";
import { speakPremium, cancelPremiumSpeech, warmBrowserVoices } from "@/lib/ai/premiumVoice";
import {
  getGreeting,
  getLocalizedResponse,
  getPlatformIntro,
  detectInputLang,
  SUPPORTED_ASSISTANT_LANGS,
  type AssistantLang,
} from "@/lib/ai/assistant-i18n";
import { VoiceWaveform } from "@/components/ai/VoiceWaveform";
import {
  DEFAULT_GLOBAL_FILTERS,
  globalFiltersToUrlParams,
  urlParamsToGlobalFilters,
} from "@/components/search/FilterState";
import type { GlobalSearchFiltersExtended } from "@/components/search/FilterState";
import { usePlatformAssistant } from "@/components/ai/PlatformAssistantContext";

type Msg = { id: string; role: "user" | "assistant"; text: string; dir?: "rtl" | "ltr" };

const QUICK_FR = [
  "Condo 2 chambres à Montréal sous 650k",
  "Séjour court à Laval ce weekend pour 2",
  "Location avec stationnement sous 1800$",
  "Comment réserver un séjour BNHub ?",
  "C'est quoi LECIPM ?",
  "Inscrire ma propriété",
];

const QUICK_EN = [
  "2-bedroom condo in Montreal under 650k",
  "Short stays in Laval this weekend for 2 guests",
  "Rental with parking under 1800",
  "How do I book a BNHub stay?",
  "What is LECIPM?",
  "List my property",
];

const QUICK_AR = [
  "شقة غرفتين في مونتريال أقل من 650 ألف",
  "إقامة قصيرة في لافال هذا الأسبوع",
  "كيف أحجز إقامة BNHub؟",
  "ما هي منصة LECIPM؟",
  "أريد تسجيل عقاري",
];

function getQuickPrompts(lang: AssistantLang): string[] {
  switch (lang) {
    case "fr-CA": return QUICK_FR;
    case "ar": return QUICK_AR;
    default: return QUICK_EN;
  }
}

const LANG_LABELS: Record<AssistantLang, string> = {
  "fr-CA": "FR",
  "en-CA": "EN",
  "ar": "عر",
};

const VOICE_MODE_STRINGS: Record<string, Record<AssistantLang, string>> = {
  listening: { "fr-CA": "Je vous écoute…", "en-CA": "I'm listening…", "ar": "…أنا أستمع" },
  processing: { "fr-CA": "Un instant…", "en-CA": "One moment…", "ar": "…لحظة" },
  speaking: { "fr-CA": "Voici ce que j'ai trouvé", "en-CA": "Here's what I found", "ar": "إليكم ما وجدته" },
  idle: { "fr-CA": "Prête à vous aider", "en-CA": "Ready to help", "ar": "جاهزة للمساعدة" },
  paused: { "fr-CA": "En pause", "en-CA": "Paused", "ar": "متوقفة مؤقتاً" },
  subtitle_listening: {
    "fr-CA": "Parlez naturellement — je comprends les recherches immobilières et les questions sur la plateforme",
    "en-CA": "Speak naturally — I understand property searches and platform questions",
    "ar": "تحدثوا بشكل طبيعي — أفهم البحث العقاري والأسئلة حول المنصة",
  },
  subtitle_processing: { "fr-CA": "Traitement de votre demande…", "en-CA": "Processing your request…", "ar": "…جاري معالجة طلبكم" },
  subtitle_speaking: { "fr-CA": "Écoutez ma réponse, puis posez votre prochaine question", "en-CA": "Listen to my response, then ask your next question", "ar": "استمعوا لإجابتي، ثم اطرحوا سؤالكم التالي" },
  subtitle_idle: { "fr-CA": "Appuyez sur le microphone ci-dessus pour démarrer", "en-CA": "Tap the microphone above to start a conversation", "ar": "اضغطوا على الميكروفون أعلاه للبدء" },
  subtitle_paused: { "fr-CA": "Conversation en pause", "en-CA": "Conversation paused", "ar": "المحادثة متوقفة مؤقتاً" },
  end_btn: { "fr-CA": "Terminer la conversation", "en-CA": "End conversation", "ar": "إنهاء المحادثة" },
  premium_label: { "fr-CA": "Voix premium", "en-CA": "Premium voice", "ar": "صوت مميز" },
  lang_label: { "fr-CA": "Français (Canada)", "en-CA": "English (Canada)", "ar": "(العربية)" },
};

function snapshotFromSearchHref(href: string): Partial<GlobalSearchFiltersExtended> | null {
  const q = href.split("?")[1];
  if (!q) return null;
  return urlParamsToGlobalFilters(new URLSearchParams(q));
}

const AUTO_GREET_KEY = "lecipm_assistant_greeted";

export function PlatformAssistant() {
  const cfg = getAssistantConfig();
  const router = useRouter();
  const { open, setOpen, toggle, pageContext, lastSearchSnapshot, setLastSearchSnapshot } =
    usePlatformAssistant();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "unsupported" | "denied">("idle");
  const [voiceMode, setVoiceMode] = useState(false);
  const [assistantLang, setAssistantLang] = useState<AssistantLang>("fr-CA");
  const listRef = useRef<HTMLDivElement>(null);
  const voiceRef = useRef<{ stop: () => void } | null>(null);
  const titleId = useId();
  const greetedRef = useRef(false);

  useEffect(() => {
    return () => {
      voiceRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    warmBrowserVoices();
  }, []);

  // Auto-greet: open assistant and welcome visitor on first visit
  useEffect(() => {
    if (!cfg.assistantEnabled || !cfg.autoGreetEnabled || greetedRef.current) return;
    if (typeof window === "undefined") return;
    const greeted = sessionStorage.getItem(AUTO_GREET_KEY);
    if (greeted) return;
    greetedRef.current = true;

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(AUTO_GREET_KEY, "1");
      setOpen(true);
      const greeting = getGreeting(assistantLang);
      setMessages((m) => [...m, { id: `a-greet-${Date.now()}`, role: "assistant", text: greeting }]);
      trackAssistantEvent("assistant_opened");
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [cfg.assistantEnabled, cfg.autoGreetEnabled, setOpen, assistantLang]);

  useEffect(() => {
    if (!open) return;
    trackAssistantEvent("assistant_opened");
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const pushAssistant = useCallback((text: string, dir?: "rtl" | "ltr") => {
    setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text, dir }]);
  }, []);

  const respondLocalized = useCallback((key: string, lang: AssistantLang) => {
    const text = getLocalizedResponse(key, lang);
    const langInfo = SUPPORTED_ASSISTANT_LANGS.find((l) => l.code === lang);
    pushAssistant(text, langInfo?.dir);
  }, [pushAssistant]);

  const runPipeline = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      const detectedLang = detectInputLang(text);
      const lang = detectedLang ?? assistantLang;
      if (detectedLang && detectedLang !== assistantLang) {
        setAssistantLang(detectedLang);
      }
      const langInfo = SUPPORTED_ASSISTANT_LANGS.find((l) => l.code === lang);

      setBusy(true);
      setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text }]);
      trackAssistantEvent("assistant_message_sent", { len: text.length, lang });

      try {
        // Platform intro / "what is LECIPM" intent
        if (/\b(c'est quoi|qu'est[- ]ce que|what is|who is|ما هي|ما هو)\b.*\b(lecipm|plateforme|platform|منصة)\b/i.test(text) ||
            /\b(lecipm|plateforme|platform|منصة)\b.*\b(c'est quoi|qu'est|what is|who|ما هي)\b/i.test(text)) {
          pushAssistant(getPlatformIntro(lang), langInfo?.dir);
          trackAssistantEvent("assistant_help_intent_used", { intent: "platform_intro" });
          return;
        }

        let followUpMerged: ReturnType<typeof mergeFollowUpSearch> = null;
        if (lastSearchSnapshot && /\b(under|below|only|make it|sous|moins de|أقل)\b/i.test(text)) {
          followUpMerged = mergeFollowUpSearch(lastSearchSnapshot, text);
        }

        if (
          followUpMerged &&
          ((followUpMerged.priceMax ?? 0) > 0 ||
            (followUpMerged.priceMin ?? 0) > 0 ||
            (followUpMerged.location && followUpMerged.location.trim()) ||
            followUpMerged.bedrooms != null)
        ) {
          const f: GlobalSearchFiltersExtended = {
            ...DEFAULT_GLOBAL_FILTERS,
            ...lastSearchSnapshot,
            ...followUpMerged,
          };
          const qs = globalFiltersToUrlParams(f).toString();
          const href = qs ? `/search?${qs}` : "/search";
          router.push(href);
          setLastSearchSnapshot(f);
          respondLocalized("search_updated", lang);
          trackAssistantEvent("assistant_search_executed", { followUp: true });
          return;
        }

        const route = routeAssistantIntent(text, pageContext);

        if (route.intent === "compare_listings") {
          if (cfg.compareEnabled && pageContext.compareListingIds?.length === 2) {
            const [a, b] = pageContext.compareListingIds;
            pushAssistant(compareListings({ id: a }, { id: b }));
            trackAssistantEvent("assistant_compare_used");
          } else {
            respondLocalized("compare_listings", lang);
          }
          return;
        }

        if (route.intent === "listing_explainer") {
          if (pageContext.stayId) {
            respondLocalized("listing_explainer_stay", lang);
          } else if (pageContext.listingId) {
            respondLocalized("listing_explainer_property", lang);
          } else {
            respondLocalized("general_platform_help", lang);
          }
          trackAssistantEvent("assistant_listing_explained");
          return;
        }

        if (
          [
            "booking_help",
            "unlock_help",
            "broker_help",
            "mortgage_help",
            "host_help",
            "general_platform_help",
            "unsupported",
          ].includes(route.intent)
        ) {
          respondLocalized(route.intent, lang);
          trackAssistantEvent("assistant_help_intent_used", { intent: route.intent });
          return;
        }

        const search = route.entities.search ?? parseSearchIntent(text);

        if (route.nextAction === "stay_navigate" || search.category === "stay") {
          const href = buildStaySearchHref(search);
          router.push(href);
          pushAssistant(confirmationLineForStay(search));
          trackAssistantEvent("assistant_search_executed", { kind: "stay" });
          return;
        }

        if (route.nextAction === "search_navigate") {
          const href = buildPropertySearchHref(search);
          router.push(href);
          const snap = snapshotFromSearchHref(href);
          if (snap) setLastSearchSnapshot(snap);
          pushAssistant(confirmationLineForProperty(search));
          trackAssistantEvent("assistant_search_executed", { kind: "property" });
          return;
        }

        respondLocalized("unsupported", lang);
      } finally {
        setBusy(false);
      }
    },
    [lastSearchSnapshot, pageContext, pushAssistant, respondLocalized, router, setLastSearchSnapshot, cfg.compareEnabled, assistantLang]
  );

  const onVoice = useCallback(() => {
    if (!cfg.voiceInputEnabled) return;
    if (!isSpeechRecognitionSupported()) {
      setVoiceState("unsupported");
      pushAssistant("Voice input isn't supported in this browser. Try Chrome or Edge, or type your request.");
      return;
    }
    setVoiceState("listening");
    trackAssistantEvent("assistant_voice_started");
    voiceRef.current?.stop();
    const ctrl = startVoiceSearch({
      lang: assistantLang === "ar" ? "ar" : assistantLang,
      onTranscript: (t) => {
        trackAssistantEvent("assistant_voice_transcribed", { len: t.length });
        setInput((prev) => (prev ? `${prev} ${t}` : t));
        setVoiceState("idle");
      },
      onError: (msg) => {
        if (msg.includes("permission")) setVoiceState("denied");
        else setVoiceState("idle");
        if (msg) pushAssistant(msg);
      },
      onListeningChange: (v) => {
        if (!v) setVoiceState("idle");
      },
    });
    voiceRef.current = ctrl;
  }, [cfg.voiceInputEnabled, pushAssistant, assistantLang]);

  const speakLast = useCallback(() => {
    if (!cfg.textToSpeechEnabled) return;
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last?.text) return;
    cancelPremiumSpeech();
    void speakPremium({ text: last.text, lang: assistantLang });
    trackAssistantEvent("assistant_tts_used");
  }, [cfg.textToSpeechEnabled, messages, assistantLang]);

  const runPipelineRef = useRef(runPipeline);

  useEffect(() => {
    runPipelineRef.current = runPipeline;
  }, [runPipeline]);

  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const voiceConversation = useVoiceConversation({
    enabled: cfg.voiceConversationEnabled && cfg.voiceInputEnabled && cfg.textToSpeechEnabled,
    onTranscript: useCallback((text: string) => {
      runPipelineRef.current(text);
      const latest = messagesRef.current;
      const last = [...latest].reverse().find((m) => m.role === "assistant");
      return last?.text;
    }, []),
  });

  const toggleVoiceMode = useCallback(() => {
    if (voiceMode) {
      voiceConversation.stop();
      setVoiceMode(false);
      trackAssistantEvent("assistant_voice_conversation_ended");
    } else {
      setVoiceMode(true);
      voiceConversation.setLang(assistantLang === "ar" ? "ar" : assistantLang as "fr-CA" | "en-CA");
      voiceConversation.start();
      trackAssistantEvent("assistant_voice_conversation_started");
    }
  }, [voiceMode, voiceConversation, assistantLang]);

  const onLangToggle = useCallback(() => {
    const langs = SUPPORTED_ASSISTANT_LANGS.map((l) => l.code);
    const idx = langs.indexOf(assistantLang);
    const next = langs[(idx + 1) % langs.length];
    setAssistantLang(next);
    voiceConversation.setLang(next as "fr-CA" | "en-CA" | "ar");
    trackAssistantEvent("assistant_voice_language_changed", { lang: next });
  }, [assistantLang, voiceConversation]);

  useEffect(() => {
    if (!open && voiceMode) {
      voiceConversation.stop();
      setVoiceMode(false);
    }
  }, [open, voiceMode, voiceConversation]);

  if (!cfg.assistantEnabled) return null;

  const vLang = voiceConversation.lang as AssistantLang;
  const isRtl = assistantLang === "ar";
  const placeholderText = assistantLang === "fr-CA"
    ? "Tapez ou utilisez le micro…"
    : assistantLang === "ar"
      ? "…اكتبوا أو استخدموا الميكروفون"
      : "Type or use the mic…";

  const panel = (
    <>
      <button
        type="button"
        onClick={() => toggle()}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-[190] flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#0a0a0a] text-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.35)] transition hover:shadow-[0_0_36px_rgba(212,175,55,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0B] md:bottom-8"
        aria-label={open ? "Close assistant" : "Open platform assistant"}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[195] flex flex-col bg-black/70 backdrop-blur-sm md:items-end"
        >
          <button type="button" className="min-h-0 flex-1 md:max-w-none" aria-label="Close assistant" onClick={() => setOpen(false)} />
          <div className="flex max-h-[92dvh] w-full flex-col border-t border-[#D4AF37]/25 bg-[#0a0a0a] shadow-2xl md:max-w-lg md:border-l md:border-t-0">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 id={titleId} className="text-lg font-semibold text-white">
                LECIPM Assistant
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onLangToggle}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                  aria-label="Switch language"
                  title={VOICE_MODE_STRINGS.lang_label[assistantLang]}
                >
                  <Globe className="h-4 w-4" aria-hidden />
                  {LANG_LABELS[assistantLang]}
                </button>
                {cfg.voiceConversationEnabled && cfg.voiceInputEnabled && cfg.textToSpeechEnabled ? (
                  <button
                    type="button"
                    onClick={toggleVoiceMode}
                    className={`rounded-lg p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${voiceMode ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/60 hover:bg-white/10 hover:text-[#D4AF37]"}`}
                    aria-label={voiceMode ? "Exit voice conversation" : "Start voice conversation"}
                    aria-pressed={voiceMode}
                  >
                    {voiceMode ? <MicOff className="h-5 w-5" aria-hidden /> : <Mic className="h-5 w-5" aria-hidden />}
                  </button>
                ) : null}
                {cfg.textToSpeechEnabled && !voiceMode ? (
                  <button
                    type="button"
                    onClick={speakLast}
                    className="rounded-lg p-2 text-[#D4AF37] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                    aria-label="Read last reply aloud"
                  >
                    <Volume2 className="h-5 w-5" aria-hidden />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-white/80 hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  dir={m.dir}
                  className={`max-w-[95%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user" ? "ml-auto bg-[#D4AF37]/20 text-white" : "mr-auto bg-white/10 text-white/95"
                  }`}
                >
                  {m.text}
                </div>
              ))}
              {busy ? <p className="text-xs text-[#D4AF37]">
                {assistantLang === "fr-CA" ? "Réflexion…" : assistantLang === "ar" ? "…جاري التفكير" : "Thinking…"}
              </p> : null}

              {voiceMode ? (
                <div className="flex flex-col items-center gap-4 py-6" aria-live="polite">
                  <div className="relative">
                    <div className="absolute -inset-4 animate-pulse rounded-full bg-[#D4AF37]/10" />
                    <div className="relative rounded-full border-2 border-[#D4AF37]/40 bg-black/60 p-4">
                      <VoiceWaveform phase={voiceConversation.phase} size={56} />
                    </div>
                  </div>
                  <p className="text-base font-semibold text-white" dir={vLang === "ar" ? "rtl" : "ltr"}>
                    {VOICE_MODE_STRINGS[voiceConversation.phase]?.[vLang] ?? VOICE_MODE_STRINGS.idle[vLang]}
                  </p>
                  <p className="text-center text-sm text-white/60" dir={vLang === "ar" ? "rtl" : "ltr"}>
                    {VOICE_MODE_STRINGS[`subtitle_${voiceConversation.phase}`]?.[vLang] ?? VOICE_MODE_STRINGS.subtitle_idle[vLang]}
                  </p>
                  <p className="text-xs text-white/40">
                    {VOICE_MODE_STRINGS.lang_label[vLang]}
                    {" · "}
                    {VOICE_MODE_STRINGS.premium_label[vLang]}
                  </p>
                  <button
                    type="button"
                    onClick={toggleVoiceMode}
                    className="mt-2 rounded-full border border-red-400/30 bg-red-500/10 px-5 py-2.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    {VOICE_MODE_STRINGS.end_btn[vLang]}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1" dir={isRtl ? "rtl" : "ltr"}>
                  {getQuickPrompts(assistantLang).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        void runPipeline(q);
                      }}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-left text-xs text-white/90 hover:border-[#D4AF37]/40"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              {voiceState === "unsupported" ? (
                <p className="mb-2 text-xs text-amber-300/90">Voice isn&apos;t available in this browser.</p>
              ) : null}
              {voiceState === "denied" ? (
                <p className="mb-2 text-xs text-amber-300/90">Microphone permission denied.</p>
              ) : null}
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <label htmlFor="assistant-input" className="sr-only">
                    Message to assistant
                  </label>
                  <input
                    id="assistant-input"
                    dir={isRtl ? "rtl" : "ltr"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        const t = input.trim();
                        if (t) {
                          setInput("");
                          void runPipeline(t);
                        }
                      }
                    }}
                    placeholder={placeholderText}
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-3 py-3 pr-24 text-sm text-white placeholder:text-white/40 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                  />
                  <button
                    type="button"
                    onClick={onVoice}
                    disabled={!cfg.voiceInputEnabled || voiceState === "listening"}
                    className={`absolute right-12 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#D4AF37]/80 text-[#D4AF37] hover:bg-[#D4AF37]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] disabled:opacity-50 ${voiceState === "listening" ? "animate-pulse" : ""}`}
                    aria-label="Speak message"
                    aria-pressed={voiceState === "listening"}
                  >
                    <Mic className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = input.trim();
                      if (t) {
                        setInput("");
                        void runPipeline(t);
                      }
                    }}
                    disabled={busy}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#D4AF37] text-black hover:brightness-110 disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
              {voiceState === "listening" ? (
                <p className="mt-2 text-xs font-medium text-[#D4AF37]" aria-live="polite">
                  {assistantLang === "fr-CA" ? "Écoute en cours… parlez maintenant" : assistantLang === "ar" ? "…الاستماع جارٍ — تحدثوا الآن" : "Listening… speak now"}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  if (typeof document === "undefined") return panel;
  return createPortal(panel, document.body);
}
