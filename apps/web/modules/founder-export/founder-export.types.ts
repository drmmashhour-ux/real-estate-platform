export type SimulationExportFormat = "json" | "csv" | "markdown";

export type PitchExportFormat = "json" | "markdown" | "deck_structured" | "pdf_payload";

/** Payload suitable for a PDF renderer or slide tool — no binary generation here. */
export type PdfReadyPitchPayload = {
  kind: "pdf_ready_pitch_v1";
  generatedAt: string;
  title: string;
  slides: Array<{
    slideNumber: number;
    title: string;
    headline: string;
    bullets: string[];
    speakerNotes: string;
    optionalVisualSuggestion?: string;
  }>;
  disclaimers: string[];
};

export type FounderReportExportFormat = "markdown_briefing" | "json_bundle";
