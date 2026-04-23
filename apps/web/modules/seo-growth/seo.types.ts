/** Generated content shapes */
export type SeoContentKind = "ARTICLE" | "LANDING_PAGE" | "GUIDE";

/** Keyword buckets for the domination loop */
export type KeywordTheme = "REAL_ESTATE_CORE" | "LOCATION" | "INVESTMENT";

export type KeywordRecord = {
  id: string;
  phrase: string;
  theme: KeywordTheme;
  /** Optional metro / city focus */
  location?: string;
  /** Relative demand score 1–10 for prioritization */
  strength: number;
};

export type SeoMetadata = {
  title: string;
  description: string;
  canonicalPath: string;
  ogTitle?: string;
  ogDescription?: string;
  keywords?: string[];
};

/** Virtual page blueprint — wire to CMS or Next routes */
export type SeoPageSpec = {
  slug: string;
  path: string;
  kind: SeoContentKind;
  metadata: SeoMetadata;
};

export type SeoContentPiece = {
  id: string;
  kind: SeoContentKind;
  title: string;
  slug: string;
  targetKeywordId: string;
  targetPhrase: string;
  body: string;
  excerpt: string;
  pageSpec: SeoPageSpec;
  createdAtIso: string;
};

export type SeoContentMetrics = {
  contentId: string;
  sessions: number;
  /** Average position when present (optional) */
  avgRankPosition?: number;
  rankingSamples: number;
  leadsAttributed: number;
};

export type SeoPerformanceSummary = {
  totalContent: number;
  totalSessions: number;
  avgPosition: number | null;
  totalLeadsFromSeo: number;
};
