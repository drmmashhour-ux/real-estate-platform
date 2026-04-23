import type {
  KeywordRecord,
  SeoContentKind,
  SeoContentPiece,
  SeoMetadata,
  SeoPageSpec,
} from "./seo.types";

const CONTENT_STORE_KEY = "lecipm-seo-growth-content-v1";

export type SeoContentStore = {
  items: Record<string, SeoContentPiece>;
};

function emptyContentStore(): SeoContentStore {
  return { items: {} };
}

let contentMemory: SeoContentStore = emptyContentStore();

function loadContentStore(): SeoContentStore {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(CONTENT_STORE_KEY);
      if (raw) contentMemory = { ...emptyContentStore(), ...JSON.parse(raw) } as SeoContentStore;
    } catch {
      /* ignore */
    }
  }
  return contentMemory;
}

function saveContentStore(store: SeoContentStore): void {
  contentMemory = store;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(CONTENT_STORE_KEY, JSON.stringify(store));
    } catch {
      /* quota */
    }
  }
}

export function resetSeoContentStoreForTests(): void {
  contentMemory = emptyContentStore();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(CONTENT_STORE_KEY);
    } catch {
      /* noop */
    }
  }
}

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `seo-${Date.now()}`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 72);
}

export function buildSeoMetadata(args: {
  title: string;
  description: string;
  slug: string;
  extraKeywords?: string[];
}): SeoMetadata {
  const path = `/seo/${args.slug}`;
  return {
    title: args.title.slice(0, 60),
    description: args.description.slice(0, 155),
    canonicalPath: path,
    ogTitle: args.title.slice(0, 60),
    ogDescription: args.description.slice(0, 160),
    keywords: args.extraKeywords?.slice(0, 12),
  };
}

export function buildPageSpec(args: {
  kind: SeoContentKind;
  title: string;
  description: string;
  slug: string;
  extraKeywords?: string[];
}): SeoPageSpec {
  const metadata = buildSeoMetadata(args);
  return {
    slug: args.slug,
    path: metadata.canonicalPath,
    kind: args.kind,
    metadata,
  };
}

function paragraph(lines: string[]): string {
  return lines.join("\n\n");
}

export type GenerateContentArgs = {
  keyword: KeywordRecord;
  kind: SeoContentKind;
  brandName?: string;
};

/**
 * Deterministic long-form assets — replace with LLM pipeline later.
 */
export function generateSeoContent(args: GenerateContentArgs): Omit<SeoContentPiece, "id" | "createdAtIso"> {
  const brand = args.brandName ?? "LECIPM";
  const city = args.keyword.location ?? "your market";
  const phrase = args.keyword.phrase;
  const slug = slugify(`${phrase}-${city}`.replace(/\s+/g, "-")).replace(/-+/g, "-");

  let title: string;
  let excerpt: string;
  let body: string;

  if (args.kind === "ARTICLE") {
    title =
      args.keyword.theme === "INVESTMENT"
        ? `Best areas to invest — ${phrase} (${city})`
        : phrase.toLowerCase().includes("broker")
          ? `How brokers get more clients in ${city}`
          : `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)} — ${city} playbook`;

    excerpt = `Data-backed overview for ${phrase} in ${city}: inventory signals, buyer intent, and next steps on ${brand}.`;

    body = paragraph([
      `# ${title}`,
      `## TL;DR`,
      `Readers searching **${phrase}** want clarity fast. This article maps demand, neighbourhoods, and a simple path to talk to a vetted broker on ${brand}.`,
      `## What buyers and investors are asking`,
      `- Hyperlocal inventory and days-on-market\n- Financing and offer strategy\n- How ${brand} routes intent to specialists`,
      `## Practical checklist`,
      `1. Confirm budget and timeline\n2. Compare 2–3 micro-markets in ${city}\n3. Book a 20-minute discovery with a ${brand} partner`,
      `## Why this ranks`,
      `Structured headings, intent-matched hooks, and unique local modifiers help **${phrase}** surface organically while staying useful.`,
    ]);
  } else if (args.kind === "LANDING_PAGE") {
    title = `${phrase} — ${city} | ${brand}`;
    excerpt = `High-intent landing for ${phrase}. Request a curated shortlist or broker intro in one step.`;
    body = paragraph([
      `# ${title}`,
      `### Get a tailored shortlist`,
      `You searched **${phrase}**. ${brand} matches listings, stays, and opportunities to your criteria in ${city}.`,
      `**CTA:** leave email or phone — we respond same day during market hours.`,
      `### Trust & compliance`,
      `Licensed partners. No spam. Clear next step to a human.`,
    ]);
  } else {
    title = `Guide: ${phrase} in ${city}`;
    excerpt = `Download-style guide outline covering ${phrase} — positioning for SEO and PDF export later.`;
    body = paragraph([
      `# ${title}`,
      `## Introduction`,
      `Use this guide to educate prospects who discover ${brand} via **${phrase}**.`,
      `## Deep dives`,
      `- Market forces\n- Financing basics\n- Offer construction`,
      `## Appendix`,
      `Glossary and checklist for ${city}-specific nuances.`,
    ]);
  }

  const description = excerpt.slice(0, 155);
  const pageSpec = buildPageSpec({
    kind: args.kind,
    title,
    description,
    slug,
    extraKeywords: [phrase, city, brand, args.keyword.theme.toLowerCase()],
  });

  return {
    kind: args.kind,
    title,
    slug,
    targetKeywordId: args.keyword.id,
    targetPhrase: phrase,
    body,
    excerpt,
    pageSpec,
  };
}

export function finalizeContentPiece(
  draft: Omit<SeoContentPiece, "id" | "createdAtIso">
): SeoContentPiece {
  return {
    ...draft,
    id: uid(),
    createdAtIso: new Date().toISOString(),
  };
}

/** Generate, finalize, and persist — virtual “page creation”. */
export function createSeoContentPiece(args: GenerateContentArgs): SeoContentPiece {
  const draft = generateSeoContent(args);
  const piece = finalizeContentPiece(draft);
  const store = loadContentStore();
  store.items[piece.id] = piece;
  saveContentStore(store);
  return piece;
}

export function listSeoContentPieces(): SeoContentPiece[] {
  return Object.values(loadContentStore().items).sort((a, b) =>
    (b.createdAtIso || "").localeCompare(a.createdAtIso || "")
  );
}

export function getSeoContentPiece(id: string): SeoContentPiece | undefined {
  return loadContentStore().items[id];
}
