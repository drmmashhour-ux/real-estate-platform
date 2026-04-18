"use client";

export function HubJourneyNextCta() {
  return (
    <button
      type="button"
      className="rounded-full border border-amber-500/40 bg-black/60 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:border-amber-400 hover:bg-amber-500/10"
      onClick={() => {
        const copilot = document.getElementById("hub-copilot-anchor");
        const nextStep = document.getElementById("hub-next-step-anchor");
        const section = document.getElementById("hub-journey-anchor");
        const target = copilot ?? nextStep ?? section;
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      What should I do next?
    </button>
  );
}
