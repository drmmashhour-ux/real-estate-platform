import type { Metadata } from "next";
import type { GrowthCitySlug } from "@/lib/growth/geo-slugs";
import { growthCityDisplayName, growthCityRegion, growthCitySearchQuery } from "@/lib/growth/geo-slugs";

export type CityIntentKind = "buy" | "rent" | "stays" | "mortgage" | "investment";

function siteBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") || "https://lecipm.com";
}

function programmaticSeoMeta(input: {
  path: string;
  title: string;
  description: string;
  keywords: string[];
}): Metadata {
  const base = siteBase();
  const url = `${base}${input.path}`;
  const ogUrl = `${base}/brand/lecipm-mark-on-dark.svg`;
  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      type: "website",
      url,
      images: [{ url: ogUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [ogUrl],
    },
    robots: { index: true, follow: true },
  };
}

/** Default canonical URL path segment for intent landing (before optional override). */
export function defaultCityIntentPath(intent: CityIntentKind, slug: GrowthCitySlug): string {
  if (intent === "investment") return `/city/${slug}/investment`;
  if (intent === "stays") return `/stays/${slug}`;
  return `/${intent}/${slug}`;
}

export function buildCityIntentMetadata(
  intent: CityIntentKind,
  slug: GrowthCitySlug,
  opts?: { canonicalPath?: string }
): Metadata {
  const city = growthCityDisplayName(slug);
  const region = growthCityRegion(slug) === "US" ? "USA" : "Canada";
  const path = opts?.canonicalPath ?? defaultCityIntentPath(intent, slug);

  if (intent === "buy") {
    const title = `Buy a home in ${city} (${region}) | FSBO & listings | LECIPM`;
    const description = `Browse homes and FSBO listings in ${city}. Local market notes, FAQs, and a free consultation. Compare options in ${growthCitySearchQuery(slug)} on LECIPM.`;
    return programmaticSeoMeta({
      path,
      title,
      description,
      keywords: [`buy home ${city}`, `FSBO ${city}`, `real estate ${city}`, "LECIPM"],
    });
  }

  if (intent === "stays") {
    const title = `BNHub stays in ${city} (${region}) | Short-term rentals | LECIPM`;
    const description = `Discover short-term stays and nightly rentals in ${city}. Filter by dates and guests on BNHub — book with clear pricing on LECIPM.`;
    return programmaticSeoMeta({
      path,
      title,
      description,
      keywords: [`${city} vacation rental`, `short term stay ${city}`, "BNHub", "LECIPM"],
    });
  }

  if (intent === "rent") {
    const title = `Rent & short-term stays in ${city} | LECIPM BNHub`;
    const description = `Find verified stays and rentals in ${city}. Local benefits, traveler FAQs, and fast booking on LECIPM BNHub.`;
    return programmaticSeoMeta({
      path,
      title,
      description,
      keywords: [`rent ${city}`, `short term rental ${city}`, "BNHub", "LECIPM"],
    });
  }

  if (intent === "investment") {
    const title = `Real estate investment in ${city} (${region}) | Market snapshot | LECIPM`;
    const description = `Explore investment angles in ${city}: FSBO inventory, BNHub yields, and rent vs buy context. Tools and FAQs on LECIPM.`;
    return programmaticSeoMeta({
      path,
      title,
      description,
      keywords: [`invest ${city}`, `real estate investment ${city}`, `rental yield ${city}`, "LECIPM"],
    });
  }

  const title = `Mortgage broker & pre-approval in ${city} | LECIPM`;
  const description = `Get pre-approved, compare mortgage options, and talk to a verified expert serving ${city}. Free tools and local tips for ${region} buyers.`;
  return programmaticSeoMeta({
    path,
    title,
    description,
    keywords: [`mortgage ${city}`, `pre-approval ${city}`, "mortgage expert", "LECIPM"],
  });
}

export function intentBenefits(intent: CityIntentKind, slug: GrowthCitySlug): string[] {
  const city = growthCityDisplayName(slug);
  if (intent === "buy") {
    return [
      `Local FSBO and resale context for ${city}`,
      "Transparent process — speak with licensed professionals",
      "Free evaluation tools and fast response from our team",
    ];
  }
  if (intent === "rent") {
    return [
      `Curated stays and nightly rentals in ${city}`,
      "Verified BNHub hosts with clear pricing",
      "Guest protections and simple booking flow",
    ];
  }
  if (intent === "stays") {
    return [
      `Nightly stays in ${city} with BNHub filters for dates and guests`,
      "See pricing upfront before you commit",
      "Secure booking flow and clear listing detail pages",
    ];
  }
  if (intent === "investment") {
    return [
      `Blend FSBO acquisitions with BNHub yield benchmarks in ${city}`,
      "Deal analyzer + ROI tools on-platform",
      "Structured content: best pockets, rent vs buy, liquidity",
    ];
  }
  return [
    `Dedicated mortgage experts familiar with ${city}`,
    "Pre-approval guidance without pressure",
    "Platform tools + human support in one place",
  ];
}

export function intentFaqs(
  intent: CityIntentKind,
  slug: GrowthCitySlug
): Array<{ question: string; answer: string }> {
  const city = growthCityDisplayName(slug);
  if (intent === "buy") {
    return [
      {
        question: `How do I start buying in ${city}?`,
        answer: `Begin with a free property consultation or browse FSBO listings filtered for ${city}. Our team can connect you with local expertise when you're ready.`,
      },
      {
        question: "What is FSBO on LECIPM?",
        answer:
          "FSBO listings are offered directly by owners. You can explore homes, request info, and work with professionals for paperwork and negotiation.",
      },
      {
        question: "Is my consultation free?",
        answer:
          "Initial outreach and many platform tools are free. Any paid services are disclosed before you commit.",
      },
    ];
  }
  if (intent === "stays") {
    return [
      {
        question: `How do I book a stay in ${city}?`,
        answer: `Open BNHub search for ${city}, pick your dates and guest count, then review house rules and cancellation terms on each listing before you book.`,
      },
      {
        question: "Are prices shown per night?",
        answer:
          "BNHub listings show nightly rates; taxes and fees may be summarized at checkout depending on the listing. Always confirm the final total before paying.",
      },
      {
        question: "Can I share a listing with someone I’m traveling with?",
        answer: "Yes — use your browser share menu or copy the listing link from the stay page.",
      },
    ];
  }
  if (intent === "rent") {
    return [
      {
        question: `What can I rent in ${city}?`,
        answer: `BNHub offers short-term and travel stays in and near ${city}. Use filters for dates, guests, and neighbourhood preferences.`,
      },
      {
        question: "Are hosts verified?",
        answer:
          "We encourage verification and clear house rules. Always review listing details and cancellation policies before booking.",
      },
      {
        question: "Can I book for groups?",
        answer: "Many listings support multiple guests. Check the listing's guest limit and amenities.",
      },
    ];
  }
  if (intent === "investment") {
    return [
      {
        question: `Where do investors start in ${city}?`,
        answer: `Review the market snapshot, compare FSBO ask prices with BNHub nightly rates, then stress-test assumptions in the deal analyzer.`,
      },
      {
        question: "Are yield figures guaranteed?",
        answer:
          "No — displayed metrics are heuristic aggregates for education. Engage licensed professionals for underwriting and compliance.",
      },
      {
        question: "Can LECIPM connect me to a broker?",
        answer: "Yes — use Request property or the broker directory to align with someone licensed in your province or state.",
      },
    ];
  }
  return [
    {
      question: `How fast can I get pre-approved in ${city}?`,
      answer:
        "Many experts respond within one business day. Submit the mortgage inquiry form with your timeline for faster matching.",
    },
    {
      question: "Does LECIPM charge buyers for mortgage matching?",
      answer:
        "The platform provides tools and introductions; compensation to experts follows disclosed arrangements and regulations.",
    },
    {
      question: "What documents are typically needed?",
      answer:
        "Often income verification, identification, and asset summaries — your expert will provide a tailored checklist.",
    },
  ];
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
