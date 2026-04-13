import { randomUUID } from "crypto";

export type SeoPageType = "invest" | "bnb" | "buy" | "neighborhood";

export type SeoPageResult = {
  title: string;
  bodyHtml: string;
  metaDescription: string;
};

/** Programmatic SEO fragments (deterministic copy — swap for CMS/AI later). */
export async function generateSEOPage(city: string, type: SeoPageType): Promise<SeoPageResult> {
  const c = city.trim() || "Montreal";
  const titles: Record<SeoPageType, string> = {
    invest: `${c} real estate investment outlook | LECIPM`,
    bnb: `${c} short-term stays & BNHUB hosts | LECIPM`,
    buy: `Buying in ${c} with verified data | LECIPM`,
    neighborhood: `${c} neighborhoods — demand & supply | LECIPM`,
  };
  const meta = `${c} — ${type} insights, listings, and trust-forward workflows on LECIPM + BNHUB.`;
  const body = `<article><h1>${titles[type].split(" | ")[0]}</h1><p>${meta}</p></article>`;
  return { title: titles[type], bodyHtml: body, metaDescription: meta.slice(0, 158) };
}

export async function generatePost(topic: string): Promise<string> {
  const t = topic.trim() || "LECIPM marketplace update";
  return `${t} — Verified stays, real estate workflows, and Quebec-first trust signals. #LECIPM #BNHUB`;
}

export async function generateEmail(brief: string): Promise<{ subject: string; html: string }> {
  const id = randomUUID().slice(0, 8);
  return {
    subject: `LECIPM update (${id})`,
    html: `<p>${brief}</p><p><a href="https://lecipm.com">Open LECIPM</a></p>`,
  };
}
