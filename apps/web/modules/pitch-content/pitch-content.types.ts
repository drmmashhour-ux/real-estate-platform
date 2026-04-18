export type PitchSlide = {
  slideNumber: number;
  title: string;
  headline: string;
  bullets: string[];
  speakerNotes: string;
  optionalVisualSuggestion?: string;
};

export type PitchDeckContent = {
  kind: "pitch_content_estimate";
  generatedAt: string;
  companyName: string;
  slides: PitchSlide[];
  disclaimers: string[];
};
