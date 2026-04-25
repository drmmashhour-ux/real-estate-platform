"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ListingOption = {
  id: string;
  listingCode: string;
  title: string;
  price: number;
  city: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string | null;
};

type ContentCard = {
  id: string;
  title: string;
  format: string;
  goal: string;
  headline: string;
  body: string;
  cta: string;
  heroSuggestion: string;
  adobeUrl: string;
};

type SavedPack = {
  id: string;
  title: string;
  listingId: string | null;
  listingTitle: string | null;
  tone: string | null;
  output: string | null;
  language: string | null;
  folder: string | null;
  campaignStatus: string;
  plannedFor: string | null;
  reminderHoursBefore: number | null;
  reminderDismissedAt: string | null;
  isFavorite: boolean;
  lastUsedAt: string | null;
  tags: string[];
  cards: ContentCard[];
  createdAt: string;
  latestActivityAt: string | null;
  latestActivityNote: string | null;
  latestActivityAction: string | null;
  activityHistory: Array<{
    action: string;
    note: string | null;
    createdAt: string;
  }>;
};

type ToneOption = "luxury" | "family" | "investor" | "urgent_sale";
type OutputOption = "instagram_post" | "story" | "flyer" | "linkedin_post";
type LanguageOption = "en" | "fr";
type PackLibraryView = "grid" | "list";
type CampaignStatus = "draft" | "ready" | "planned" | "posted";

const BRAND_TOKENS = [
  { label: "Primary gold", value: "#D4AF37" },
  { label: "Deep black", value: "#0B0B0B" },
  { label: "Warm ivory", value: "#F5E7C1" },
];

const AVAILABLE_TAGS = [
  "luxury",
  "family",
  "investor",
  "urgent sale",
  "just listed",
  "open house",
  "seller ads",
  "just sold",
] as const;

export function BrokerContentStudioClient({
  listings,
  brokerContact,
}: {
  listings: ListingOption[];
  brokerContact: { phone: string; email: string };
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string>(listings[0]?.id ?? "");
  const [tone, setTone] = useState<ToneOption>("luxury");
  const [output, setOutput] = useState<OutputOption>("instagram_post");
  const [language, setLanguage] = useState<LanguageOption>("en");
  const [savingPack, setSavingPack] = useState(false);
  const [updatingPack, setUpdatingPack] = useState(false);
  const [duplicatingPack, setDuplicatingPack] = useState(false);
  const [renamingPackId, setRenamingPackId] = useState<string | null>(null);
  const [deletingPackId, setDeletingPackId] = useState<string | null>(null);
  const [favoritingPackId, setFavoritingPackId] = useState<string | null>(null);
  const [savedPacks, setSavedPacks] = useState<SavedPack[]>([]);
  const [packsLoaded, setPacksLoaded] = useState(false);
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [appliedCards, setAppliedCards] = useState<ContentCard[] | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(["just listed"]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [folderName, setFolderName] = useState("General");
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>("draft");
  const [plannedFor, setPlannedFor] = useState("");
  const [reminderHoursBefore, setReminderHoursBefore] = useState("24");
  const [packTagFilter, setPackTagFilter] = useState<string>("all");
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [packLibraryView, setPackLibraryView] = useState<PackLibraryView>("grid");
  const [packSearchQuery, setPackSearchQuery] = useState("");
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>([]);
  const [bulkFolderName, setBulkFolderName] = useState("General");
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDuplicating, setBulkDuplicating] = useState(false);
  const [bulkCopied, setBulkCopied] = useState(false);

  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedListingId) ?? listings[0] ?? null,
    [listings, selectedListingId]
  );

  const contentCards = useMemo<ContentCard[]>(() => {
    const listingTitle = selectedListing?.title ?? "your featured property";
    const listingCode = selectedListing?.listingCode ?? "LISTING";
    const priceLabel =
      selectedListing?.price != null ? `$${selectedListing.price.toLocaleString()} CAD` : "price on request";
    const city = selectedListing?.city ?? "your market";
    const beds = selectedListing?.bedrooms ? `${selectedListing.bedrooms} bedrooms` : null;
    const baths = selectedListing?.bathrooms ? `${selectedListing.bathrooms} bathrooms` : null;
    const propertyType = selectedListing?.propertyType
      ? selectedListing.propertyType.replace(/_/g, " ").toLowerCase()
      : "residential property";
    const specs = [propertyType, beds, baths].filter(Boolean).join(", ");
    const heroSuggestion =
      tone === "luxury"
        ? `Use a premium hero image of the best exterior or main living area for ${listingTitle}. Keep strong contrast, gold accents, and minimal text overlay.`
        : tone === "family"
          ? `Use the most welcoming family-friendly image for ${listingTitle}, ideally bright living space, kitchen, or backyard.`
          : tone === "investor"
            ? `Use a clean front elevation or strongest value-driving room for ${listingTitle}. Keep the layout structured and data-forward.`
            : `Use the most eye-catching image for ${listingTitle} with bold urgency text and strong CTA placement.`;
    const toneHeadlineLead =
      tone === "luxury"
        ? "An elevated opportunity"
        : tone === "family"
          ? "A home designed for everyday living"
          : tone === "investor"
            ? "A market-smart opportunity"
            : "Act quickly on this opportunity";
    const toneBodyLead =
      tone === "luxury"
        ? "Use a premium, elegant voice that emphasizes exclusivity, presentation, and confidence."
        : tone === "family"
          ? "Use warm, practical language centered on comfort, routine, and neighborhood value."
          : tone === "investor"
            ? "Use analytical language centered on pricing position, long-term value, and decision clarity."
            : "Use direct, high-urgency language focused on speed, scarcity, and immediate action.";
    const outputLabel =
      output === "story"
        ? "Instagram / Facebook story"
        : output === "flyer"
          ? "Flyer / one-page promo"
          : output === "linkedin_post"
            ? "LinkedIn post"
            : "Instagram / Facebook post";
    const outputBodyRule =
      output === "story"
        ? "Keep the copy short, punchy, and visual with one dominant message."
        : output === "flyer"
          ? "Use more structured wording suitable for a one-page flyer with headline, features, and CTA."
          : output === "linkedin_post"
            ? "Use a more professional and authority-driven tone appropriate for LinkedIn."
            : "Keep the copy scroll-stopping, concise, and social-ready.";
    const contactLineEn = `Broker contact: ${brokerContact.phone} · ${brokerContact.email}`;
    const contactLineFr = `Contact courtier : ${brokerContact.phone} · ${brokerContact.email}`;
    const localizedHeadlineLead =
      language === "fr"
        ? tone === "luxury"
          ? "Une opportunite haut de gamme"
          : tone === "family"
            ? "Une propriete pensee pour la vie quotidienne"
            : tone === "investor"
              ? "Une opportunite interessante pour le marche"
              : "Agissez rapidement sur cette opportunite"
        : toneHeadlineLead;
    const localizedBodyLead =
      language === "fr"
        ? tone === "luxury"
          ? "Utilisez un ton premium et elegant qui met en valeur l'exclusivite, la presentation et la confiance."
          : tone === "family"
            ? "Utilisez un langage chaleureux et pratique axe sur le confort, la routine et la valeur du quartier."
            : tone === "investor"
              ? "Utilisez un langage analytique axe sur le positionnement prix, la valeur a long terme et la clarte de decision."
              : "Utilisez un ton direct et urgent axe sur la rapidite, la rarete et l'action immediate."
        : toneBodyLead;
    const localizedOutputRule =
      language === "fr"
        ? output === "story"
          ? "Gardez un texte court, percutant et tres visuel avec un message principal."
          : output === "flyer"
            ? "Utilisez une structure adaptee a un flyer avec titre, avantages et appel a l'action."
            : output === "linkedin_post"
              ? "Utilisez un ton plus professionnel et credibe adapte a LinkedIn."
              : "Gardez un texte concis, accrocheur et adapte aux reseaux sociaux."
        : outputBodyRule;
    const contactLine = language === "fr" ? contactLineFr : contactLineEn;

    return [
      {
        id: "just-listed",
        title: "Just Listed",
        format: outputLabel,
        goal: "Attract buyer attention quickly",
        headline:
          language === "fr"
            ? `${localizedHeadlineLead} : ${listingTitle} est maintenant en ligne a ${city}`
            : `${localizedHeadlineLead}: ${listingTitle} is now live in ${city}`,
        body:
          language === "fr"
            ? `${localizedBodyLead} ${localizedOutputRule} Presentez ${listingTitle} avec un message pilote par le courtier, soulignez l'urgence et utilisez la reference ${listingCode} pour garder l'equipe alignee. Positionnez ce ${specs} comme une opportunite serieuse pour des acheteurs qualifies a ${priceLabel}. ${contactLine}`
            : `${localizedBodyLead} ${localizedOutputRule} Present ${listingTitle} with a broker-led message, highlight urgency, and use the listing reference ${listingCode} to keep the team aligned. Position this ${specs} as a serious opportunity for qualified buyers at ${priceLabel}. ${contactLine}`,
        cta: language === "fr" ? "Prenez rendez-vous pour une visite privee ou demandez le dossier complet." : "Book a private showing or message me for the full listing file.",
        heroSuggestion,
        adobeUrl: "https://new.express.adobe.com/",
      },
      {
        id: "open-house",
        title: "Open House",
        format: outputLabel,
        goal: "Drive scheduled visits",
        headline: language === "fr" ? `Visite libre pour ${listingTitle} a ${city}` : `Open house for ${listingTitle} in ${city}`,
        body:
          language === "fr"
            ? `${localizedBodyLead} ${localizedOutputRule} Invitez les acheteurs a decouvrir ${listingTitle} en personne. Mettez en avant l'attrait visuel et le style de vie du bien, y compris ${specs}, ajoutez la plage horaire, et gardez un message cible sur des visiteurs qualifies. ${contactLine}`
            : `${localizedBodyLead} ${localizedOutputRule} Invite buyers to discover ${listingTitle} in person. Emphasize the property's strongest visual and lifestyle appeal, including ${specs}, add the visit window, and keep the message focused on qualified attendance. ${contactLine}`,
        cta: language === "fr" ? "Ecrivez-nous pour reserver votre plage de visite." : "DM to reserve your visit time.",
        heroSuggestion,
        adobeUrl: "https://new.express.adobe.com/",
      },
      {
        id: "seller-magnet",
        title: "Seller Attraction",
        format: outputLabel,
        goal: "Win more seller mandates",
        headline: language === "fr" ? `Vous pensez vendre a ${city} dans les 90 prochains jours ?` : `Thinking of selling in ${city} in the next 90 days?`,
        body:
          language === "fr"
            ? `${localizedBodyLead} ${localizedOutputRule} Utilisez ${listingTitle} comme preuve de votre methode. Positionnez-vous autour du controle legal, de la clarte du prix, du suivi des leads et d'une presentation soignee. Montrez aux vendeurs que vous faites plus que diffuser : vous gerez l'exposition, la confiance et la preparation a la transaction du debut a la fin. ${contactLine}`
            : `${localizedBodyLead} ${localizedOutputRule} Use ${listingTitle} as proof of your process. Position yourself around legal control, pricing clarity, lead follow-up, and polished presentation. Show sellers that you do more than list: you manage exposure, trust, and deal readiness from start to finish, whether the property is a ${propertyType} or another premium residential asset. ${contactLine}`,
        cta: language === "fr" ? "Demandez une revue confidentielle de votre strategie de vente." : "Request a confidential sale strategy review.",
        heroSuggestion,
        adobeUrl: "https://new.express.adobe.com/",
      },
      {
        id: "just-sold",
        title: "Just Sold",
        format: outputLabel,
        goal: "Show proof and attract referrals",
        headline: language === "fr" ? `${listingTitle} s'est vendu avec strategie a ${city}` : `${listingTitle} moved with strategy in ${city}`,
        body:
          language === "fr"
            ? `${localizedBodyLead} ${localizedOutputRule} Transformez ${listingTitle} en publication de preuve axee sur l'execution : positionnement, presentation, suivi et discipline transactionnelle. Mentionnez que ce ${specs} demandait une structure pilotee par le courtier, pas seulement de la visibilite. ${contactLine}`
            : `${localizedBodyLead} ${localizedOutputRule} Turn ${listingTitle} into a proof post focused on execution: positioning, presentation, follow-up, and transaction discipline. Mention that this ${specs} required broker-led structure, not just exposure, to attract the right buyer. ${contactLine}`,
        cta: language === "fr" ? "Si vous voulez ce niveau d'accompagnement pour votre propriete, contactez-moi." : "If you want this level of support for your property, contact me.",
        heroSuggestion,
        adobeUrl: "https://new.express.adobe.com/",
      },
    ];
  }, [selectedListing, tone, output, language, brokerContact]);

  const visibleCards = appliedCards ?? contentCards;
  const availableTags = useMemo(() => {
    const savedPackTags = savedPacks.flatMap((pack) => pack.tags ?? []);
    return Array.from(new Set([...AVAILABLE_TAGS, ...savedPackTags]));
  }, [savedPacks]);
  const availableFolders = useMemo(() => {
    const folders = savedPacks
      .map((pack) => pack.folder?.trim())
      .filter((folder): folder is string => Boolean(folder));
    return Array.from(new Set(["General", ...folders]));
  }, [savedPacks]);
  const filteredPacks = useMemo(
    () =>
      savedPacks.filter((pack) => {
        const matchesTag = packTagFilter === "all" ? true : pack.tags?.includes(packTagFilter);
        const resolvedFolder = pack.folder?.trim() || "General";
        const matchesFolder = folderFilter === "all" ? true : resolvedFolder === folderFilter;
        const matchesStatus = statusFilter === "all" ? true : pack.campaignStatus === statusFilter;
        const searchNeedle = packSearchQuery.trim().toLowerCase();
        const matchesSearch =
          !searchNeedle ||
          pack.title.toLowerCase().includes(searchNeedle) ||
          resolvedFolder.toLowerCase().includes(searchNeedle) ||
          pack.tags.some((tag) => tag.toLowerCase().includes(searchNeedle));
        return matchesTag && matchesFolder && matchesStatus && matchesSearch;
      }),
    [savedPacks, packTagFilter, folderFilter, statusFilter, packSearchQuery]
  );
  const favoritePacks = useMemo(() => savedPacks.filter((pack) => pack.isFavorite), [savedPacks]);
  const recentPacks = useMemo(
    () =>
      [...savedPacks]
        .filter((pack) => pack.lastUsedAt)
        .sort((a, b) => new Date(b.lastUsedAt ?? 0).getTime() - new Date(a.lastUsedAt ?? 0).getTime())
        .slice(0, 4),
    [savedPacks]
  );
  const plannedTimelineGroups = useMemo(() => {
    const plannedPacks = [...savedPacks]
      .filter((pack) => pack.campaignStatus === "planned" && pack.plannedFor)
      .sort((a, b) => new Date(a.plannedFor ?? 0).getTime() - new Date(b.plannedFor ?? 0).getTime());

    const groups = new Map<string, SavedPack[]>();
    for (const pack of plannedPacks) {
      const plannedDate = new Date(pack.plannedFor ?? "");
      const key = Number.isNaN(plannedDate.getTime()) ? "Unscheduled" : plannedDate.toLocaleDateString();
      const current = groups.get(key) ?? [];
      current.push(pack);
      groups.set(key, current);
    }

    return Array.from(groups.entries()).map(([dateLabel, packs]) => ({
      dateLabel,
      packs,
    }));
  }, [savedPacks]);
  const scheduleHealth = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const plannedPacks = savedPacks.filter((pack) => pack.campaignStatus === "planned" && pack.plannedFor);
    const overdue = plannedPacks.filter((pack) => {
      const plannedDate = new Date(pack.plannedFor ?? "");
      return !Number.isNaN(plannedDate.getTime()) && plannedDate < now;
    });
    const today = plannedPacks.filter((pack) => {
      const plannedDate = new Date(pack.plannedFor ?? "");
      return !Number.isNaN(plannedDate.getTime()) && plannedDate >= startOfToday && plannedDate <= endOfToday;
    });
    const upcoming = [...plannedPacks]
      .filter((pack) => {
        const plannedDate = new Date(pack.plannedFor ?? "");
        return !Number.isNaN(plannedDate.getTime()) && plannedDate > now;
      })
      .sort((a, b) => new Date(a.plannedFor ?? 0).getTime() - new Date(b.plannedFor ?? 0).getTime())
      .slice(0, 3);

    return { overdue, today, upcoming };
  }, [savedPacks]);
  const reminderQueue = useMemo(() => {
    const now = new Date();
    const items = savedPacks
      .filter(
        (pack) =>
          pack.campaignStatus === "planned" &&
          pack.plannedFor &&
          pack.reminderHoursBefore &&
          !pack.reminderDismissedAt
      )
      .map((pack) => {
        const plannedDate = new Date(pack.plannedFor ?? "");
        const reminderAt = new Date(
          plannedDate.getTime() - (pack.reminderHoursBefore ?? 0) * 60 * 60 * 1000
        );
        return {
          pack,
          reminderAt,
          isDue:
            !Number.isNaN(reminderAt.getTime()) &&
            reminderAt <= now &&
            !Number.isNaN(plannedDate.getTime()),
        };
      })
      .filter((item) => !Number.isNaN(item.reminderAt.getTime()))
      .sort((a, b) => itemTime(a.reminderAt) - itemTime(b.reminderAt));

    return {
      dueNow: items.filter((item) => item.isDue),
      upcoming: items.filter((item) => !item.isDue).slice(0, 5),
    };
  }, [savedPacks]);
  const selectedPackCount = selectedPackIds.length;

  function itemTime(date: Date) {
    return date.getTime();
  }

  function getTimelineBadge(pack: SavedPack) {
    if (!pack.plannedFor) return { label: "No time", className: "border-white/15 bg-white/5 text-slate-300" };

    const now = new Date();
    const plannedDate = new Date(pack.plannedFor);
    if (Number.isNaN(plannedDate.getTime())) {
      return { label: "Invalid time", className: "border-red-400/30 bg-red-500/10 text-red-200" };
    }

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    if (plannedDate < now) {
      return { label: "Overdue", className: "border-red-400/30 bg-red-500/10 text-red-200" };
    }
    if (plannedDate >= startOfToday && plannedDate <= endOfToday) {
      return { label: "Today", className: "border-amber-400/30 bg-amber-500/10 text-amber-200" };
    }
    return { label: "Upcoming", className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" };
  }

  async function setReminder(pack: SavedPack, hoursBefore: number) {
    await persistPackMeta(pack, {
      reminderHoursBefore: hoursBefore,
      reminderDismissedAt: null,
    });
  }

  async function dismissReminder(pack: SavedPack) {
    await persistPackMeta(pack, {
      reminderDismissedAt: new Date().toISOString(),
    });
  }

  async function reschedulePack(pack: SavedPack, hoursFromNow: number) {
    const nextDate = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
    await persistPackMeta(pack, {
      plannedFor: nextDate,
      campaignStatus: "planned",
      reminderDismissedAt: null,
    });
  }

  async function copyCard(card: ContentCard) {
    const text = [
      card.headline,
      "",
      card.body,
      "",
      `CTA: ${card.cta}`,
      "",
      `Hero suggestion: ${card.heroSuggestion}`,
      "",
      "Brand guidance:",
      "Use LECIPM gold + black palette with broker identity and contact details.",
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedId(card.id);
    window.setTimeout(() => setCopiedId((current) => (current === card.id ? null : current)), 1800);
  }

  async function saveContentPack() {
    if (!selectedListing) return;
    setSavingPack(true);
    try {
      const response = await fetch("/api/broker/content-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selectedListing.id,
          listingTitle: selectedListing.title,
          tone,
          output,
          language,
          folder: folderName,
          campaignStatus,
          plannedFor: plannedFor || null,
          reminderHoursBefore: Number.parseInt(reminderHoursBefore, 10) || null,
          reminderDismissedAt: null,
          isFavorite: false,
          lastUsedAt: null,
          tags: selectedTags,
          cards: contentCards,
        }),
      });
      if (response.ok) {
        await loadSavedPacks(selectedListing.id);
      }
    } finally {
      setSavingPack(false);
    }
  }

  async function saveChangesToCurrentPack() {
    if (!selectedListing || !activePackId || activePackId === "custom-edit") return;
    setUpdatingPack(true);
    try {
      const response = await fetch("/api/broker/content-packs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activePackId,
          listingId: selectedListing.id,
          listingTitle: selectedListing.title,
          title:
            savedPacks.find((pack) => pack.id === activePackId)?.title ??
            `${selectedListing.title} · ${tone} · ${output}`,
          tone,
          output,
          language,
          folder: folderName,
          campaignStatus,
          plannedFor: plannedFor || null,
          reminderHoursBefore: Number.parseInt(reminderHoursBefore, 10) || null,
          reminderDismissedAt: savedPacks.find((pack) => pack.id === activePackId)?.reminderDismissedAt ?? null,
          isFavorite: savedPacks.find((pack) => pack.id === activePackId)?.isFavorite ?? false,
          lastUsedAt: savedPacks.find((pack) => pack.id === activePackId)?.lastUsedAt ?? null,
          tags: selectedTags,
          cards: visibleCards,
        }),
      });
      if (response.ok) {
        await loadSavedPacks(selectedListing.id);
      }
    } finally {
      setUpdatingPack(false);
    }
  }

  async function duplicateCurrentPack() {
    if (!selectedListing) return;
    setDuplicatingPack(true);
    try {
      const response = await fetch("/api/broker/content-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selectedListing.id,
          listingTitle: `${selectedListing.title} copy`,
          tone,
          output,
          language,
          folder: folderName,
          campaignStatus,
          plannedFor: plannedFor || null,
          reminderHoursBefore: Number.parseInt(reminderHoursBefore, 10) || null,
          reminderDismissedAt: null,
          isFavorite: false,
          lastUsedAt: null,
          tags: selectedTags,
          cards: visibleCards,
        }),
      });
      if (response.ok) {
        await loadSavedPacks(selectedListing.id);
      }
    } finally {
      setDuplicatingPack(false);
    }
  }

  async function renamePack(pack: SavedPack) {
    const nextTitle = window.prompt("Rename content pack", pack.title);
    if (!nextTitle || !nextTitle.trim()) return;
    setRenamingPackId(pack.id);
    try {
      const response = await fetch("/api/broker/content-packs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pack.id,
          listingId: pack.listingId,
          listingTitle: pack.listingTitle,
          title: nextTitle.trim(),
          tone: pack.tone,
          output: pack.output,
          language: pack.language,
          folder: pack.folder,
          campaignStatus: pack.campaignStatus,
          plannedFor: pack.plannedFor,
          reminderHoursBefore: pack.reminderHoursBefore,
          reminderDismissedAt: pack.reminderDismissedAt,
          isFavorite: pack.isFavorite,
          lastUsedAt: pack.lastUsedAt,
          tags: pack.tags,
          cards: pack.cards,
        }),
      });
      if (response.ok && selectedListing) {
        await loadSavedPacks(selectedListing.id);
      }
    } finally {
      setRenamingPackId(null);
    }
  }

  async function deletePack(pack: SavedPack) {
    const confirmed = window.confirm(`Delete "${pack.title}"?`);
    if (!confirmed) return;
    setDeletingPackId(pack.id);
    try {
      const response = await fetch(`/api/broker/content-packs?id=${encodeURIComponent(pack.id)}`, {
        method: "DELETE",
      });
      if (response.ok && selectedListing) {
        await loadSavedPacks(selectedListing.id);
        if (activePackId === pack.id) {
          setActivePackId(null);
          setAppliedCards(null);
        }
      }
    } finally {
      setDeletingPackId(null);
    }
  }

  async function loadSavedPacks(listingId: string) {
    const response = await fetch(`/api/broker/content-packs?listingId=${encodeURIComponent(listingId)}`);
    const data = await response.json().catch(() => ({}));
    setSavedPacks(Array.isArray(data?.packs) ? data.packs : []);
    setPacksLoaded(true);
  }

  async function handleLoadSavedPacks() {
    if (!selectedListing) return;
    await loadSavedPacks(selectedListing.id);
  }

  async function persistPackMeta(pack: SavedPack, overrides: Partial<SavedPack>) {
    const response = await fetch("/api/broker/content-packs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: pack.id,
        listingId: pack.listingId,
        listingTitle: pack.listingTitle,
        title: overrides.title ?? pack.title,
        tone: overrides.tone ?? pack.tone,
        output: overrides.output ?? pack.output,
        language: overrides.language ?? pack.language,
        folder: overrides.folder ?? pack.folder,
        campaignStatus: overrides.campaignStatus ?? pack.campaignStatus,
        plannedFor: overrides.plannedFor ?? pack.plannedFor,
        reminderHoursBefore: overrides.reminderHoursBefore ?? pack.reminderHoursBefore,
        reminderDismissedAt: overrides.reminderDismissedAt ?? pack.reminderDismissedAt,
        isFavorite: overrides.isFavorite ?? pack.isFavorite,
        lastUsedAt: overrides.lastUsedAt ?? pack.lastUsedAt,
        tags: overrides.tags ?? pack.tags,
        cards: overrides.cards ?? pack.cards,
      }),
    });
    if (response.ok) {
      setSavedPacks((current) =>
        current.map((entry) => (entry.id === pack.id ? { ...entry, ...overrides } : entry))
      );
    }
  }

  function applySavedPack(pack: SavedPack) {
    if (pack.listingId) {
      setSelectedListingId(pack.listingId);
    }
    if (pack.tone === "luxury" || pack.tone === "family" || pack.tone === "investor" || pack.tone === "urgent_sale") {
      setTone(pack.tone);
    }
    if (
      pack.output === "instagram_post" ||
      pack.output === "story" ||
      pack.output === "flyer" ||
      pack.output === "linkedin_post"
    ) {
      setOutput(pack.output);
    }
    if (pack.language === "en" || pack.language === "fr") {
      setLanguage(pack.language);
    }
    setFolderName(pack.folder?.trim() || "General");
    if (
      pack.campaignStatus === "draft" ||
      pack.campaignStatus === "ready" ||
      pack.campaignStatus === "planned" ||
      pack.campaignStatus === "posted"
    ) {
      setCampaignStatus(pack.campaignStatus);
    }
    setPlannedFor(pack.plannedFor ? pack.plannedFor.slice(0, 16) : "");
    setSelectedTags(Array.isArray(pack.tags) ? pack.tags : []);
    setAppliedCards(Array.isArray(pack.cards) ? pack.cards : null);
    setActivePackId(pack.id);
    const now = new Date().toISOString();
    void persistPackMeta(pack, { lastUsedAt: now });
  }

  async function toggleFavorite(pack: SavedPack) {
    setFavoritingPackId(pack.id);
    try {
      await persistPackMeta(pack, { isFavorite: !pack.isFavorite });
    } finally {
      setFavoritingPackId(null);
    }
  }

  function togglePackSelection(packId: string) {
    setSelectedPackIds((current) =>
      current.includes(packId) ? current.filter((id) => id !== packId) : [...current, packId]
    );
  }

  function toggleSelectAllVisible() {
    const visibleIds = filteredPacks.map((pack) => pack.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedPackIds.includes(id));
    setSelectedPackIds((current) =>
      allVisibleSelected ? current.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...current, ...visibleIds]))
    );
  }

  async function bulkUpdateSelectedPacks(mode: "folder" | "tag") {
    const selectedPacks = savedPacks.filter((pack) => selectedPackIds.includes(pack.id));
    if (selectedPacks.length === 0) return;

    const nextFolder = bulkFolderName.trim() || "General";
    const nextTag = bulkTagInput.trim().toLowerCase();
    setBulkUpdating(true);
    try {
      await Promise.all(
        selectedPacks.map((pack) =>
          persistPackMeta(
            pack,
            mode === "folder"
              ? { folder: nextFolder }
              : { tags: nextTag && !pack.tags.includes(nextTag) ? [...pack.tags, nextTag] : pack.tags }
          )
        )
      );
      if (mode === "tag") {
        setBulkTagInput("");
      }
    } finally {
      setBulkUpdating(false);
    }
  }

  async function bulkDeleteSelectedPacks() {
    const selectedPacks = savedPacks.filter((pack) => selectedPackIds.includes(pack.id));
    if (selectedPacks.length === 0) return;
    const confirmed = window.confirm(`Delete ${selectedPacks.length} selected content pack(s)?`);
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      await Promise.all(
        selectedPacks.map((pack) =>
          fetch(`/api/broker/content-packs?id=${encodeURIComponent(pack.id)}`, {
            method: "DELETE",
          })
        )
      );
      setSavedPacks((current) => current.filter((pack) => !selectedPackIds.includes(pack.id)));
      setSelectedPackIds([]);
    } finally {
      setBulkDeleting(false);
    }
  }

  async function bulkDuplicateSelectedPacks() {
    const selectedPacks = savedPacks.filter((pack) => selectedPackIds.includes(pack.id));
    if (selectedPacks.length === 0) return;

    setBulkDuplicating(true);
    try {
      await Promise.all(
        selectedPacks.map((pack) =>
          fetch("/api/broker/content-packs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listingId: pack.listingId,
              listingTitle: `${pack.listingTitle ?? pack.title} copy`,
              tone: pack.tone,
              output: pack.output,
              language: pack.language,
              folder: pack.folder?.trim() || "General",
              isFavorite: false,
              lastUsedAt: null,
              tags: pack.tags,
              cards: pack.cards,
            }),
          })
        )
      );
      if (selectedListing) {
        await loadSavedPacks(selectedListing.id);
      }
    } finally {
      setBulkDuplicating(false);
    }
  }

  async function copySelectedPackSummary() {
    const selectedPacks = savedPacks.filter((pack) => selectedPackIds.includes(pack.id));
    if (selectedPacks.length === 0) return;

    const summary = selectedPacks
      .map((pack) => {
        const firstCard = pack.cards[0];
        return [
          pack.title,
          `Folder: ${pack.folder?.trim() || "General"}`,
          `Tags: ${pack.tags.join(", ") || "None"}`,
          `Cards: ${pack.cards.length}`,
          firstCard ? `Preview: ${firstCard.headline}` : "Preview: none",
        ].join("\n");
      })
      .join("\n\n---\n\n");

    await navigator.clipboard.writeText(summary);
    setBulkCopied(true);
    window.setTimeout(() => setBulkCopied(false), 1800);
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag]
    );
  }

  function addCustomTag() {
    const nextTag = customTagInput.trim().toLowerCase();
    if (!nextTag) return;
    setSelectedTags((current) => (current.includes(nextTag) ? current : [...current, nextTag]));
    setCustomTagInput("");
  }

  function updateVisibleCard(
    cardId: string,
    field: "headline" | "body" | "cta" | "heroSuggestion",
    value: string
  ) {
    const base = appliedCards ?? contentCards;
    const next = base.map((card) => (card.id === cardId ? { ...card, [field]: value } : card));
    setAppliedCards(next);
    if (!activePackId) {
      setActivePackId("custom-edit");
    }
  }

  function renderPackPreview(pack: SavedPack) {
    const previewCard = pack.cards[0];
    if (!previewCard) {
      return (
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-black p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">No preview</p>
          <p className="mt-3 text-sm text-slate-400">This pack does not contain any previewable content yet.</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-xl border border-premium-gold/15 bg-gradient-to-br from-[#17120a] via-slate-950 to-black">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-premium-gold">
            {previewCard.format}
          </p>
          <p className="mt-2 line-clamp-2 text-sm font-semibold text-white">{previewCard.headline}</p>
        </div>
        <div className="space-y-3 px-4 py-4">
          <p className="line-clamp-4 text-xs leading-5 text-slate-300">{previewCard.body}</p>
          <div className="rounded-lg border border-premium-gold/20 bg-premium-gold/10 px-3 py-2 text-xs font-medium text-premium-gold">
            {previewCard.cta}
          </div>
        </div>
      </div>
    );
  }

  function renderPackActivity(pack: SavedPack, compact = false) {
    const parseActivityNote = (note: string | null, fallbackAction: string | null) => {
      if (!note) {
        return { actor: null, detail: fallbackAction ?? "Activity recorded" };
      }

      const match = note.match(/^\[(Admin|Broker|Client|System)\]\s*(.+)$/);
      if (!match) {
        return { actor: null, detail: note };
      }

      return { actor: match[1], detail: match[2] || fallbackAction || "Activity recorded" };
    };

    const activityBadgeClass = (actor: string) =>
      actor === "Admin"
        ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
        : actor === "Broker"
          ? "border-premium-gold/30 bg-premium-gold/10 text-premium-gold"
          : actor === "Client"
            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
            : "border-sky-400/30 bg-sky-500/10 text-sky-200";

    return (
      <div className={compact ? "mt-2" : "mt-3"}>
        {pack.latestActivityAt ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {(() => {
              const latest = parseActivityNote(pack.latestActivityNote, pack.latestActivityAction);
              return (
                <>
                  <span>Last activity: {new Date(pack.latestActivityAt).toLocaleString()}</span>
                  {latest.actor ? (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${activityBadgeClass(latest.actor)}`}
                    >
                      {latest.actor}
                    </span>
                  ) : null}
                  <span>{latest.detail}</span>
                </>
              );
            })()}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No activity logged yet.</p>
        )}
        {pack.activityHistory.length > 1 ? (
          <details className="mt-2 text-xs text-slate-400">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-300">
              View recent activity history
            </summary>
            <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
              {pack.activityHistory.map((activity, index) => (
                <div key={`${pack.id}-${activity.createdAt}-${index}`} className="border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2 text-slate-300">
                    <span>{new Date(activity.createdAt).toLocaleString()}</span>
                    {parseActivityNote(activity.note, activity.action).actor ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${activityBadgeClass(parseActivityNote(activity.note, activity.action).actor!)}`}
                      >
                        {parseActivityNote(activity.note, activity.action).actor}
                      </span>
                    ) : null}
                    <span>{parseActivityNote(activity.note, activity.action).detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard/broker" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Broker hub
        </Link>

        <div className="mt-4 rounded-3xl border border-premium-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),transparent_30%),#0b0b0b] p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-premium-gold">
            Broker Content Studio
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Create broker content fast with Adobe Express
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">
            Use ready-made real estate marketing copy, launch Adobe Express in one click, and keep your broker branding consistent across social posts, listing promos, and seller attraction campaigns.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.7fr_auto_auto]">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Selected listing
              </label>
              <select
                value={selectedListingId}
                onChange={(event) => {
                  setSelectedListingId(event.target.value);
                  setActivePackId(null);
                  setAppliedCards(null);
                }}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-premium-gold/50"
              >
                {listings.length === 0 ? <option value="">No broker listings available</option> : null}
                {listings.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title} · {listing.listingCode} · ${listing.price.toLocaleString()} CAD
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Tone
              </label>
              <select
                value={tone}
                onChange={(event) => {
                  setTone(event.target.value as ToneOption);
                  setActivePackId(null);
                  setAppliedCards(null);
                }}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-premium-gold/50"
              >
                <option value="luxury">Luxury</option>
                <option value="family">Family</option>
                <option value="investor">Investor</option>
                <option value="urgent_sale">Urgent sale</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Output
              </label>
              <select
                value={output}
                onChange={(event) => {
                  setOutput(event.target.value as OutputOption);
                  setActivePackId(null);
                  setAppliedCards(null);
                }}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-premium-gold/50"
              >
                <option value="instagram_post">Instagram post</option>
                <option value="story">Story</option>
                <option value="flyer">Flyer</option>
                <option value="linkedin_post">LinkedIn post</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Campaign status
              </label>
              <select
                value={campaignStatus}
                onChange={(event) => setCampaignStatus(event.target.value as CampaignStatus)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-premium-gold/50"
              >
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="planned">Planned</option>
                <option value="posted">Posted</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Planned publish
              </label>
              <input
                type="datetime-local"
                value={plannedFor}
                onChange={(event) => setPlannedFor(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-premium-gold/50"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Reminder
              </label>
              <select
                value={reminderHoursBefore}
                onChange={(event) => setReminderHoursBefore(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-premium-gold/50"
              >
                <option value="1">1 hour before</option>
                <option value="6">6 hours before</option>
                <option value="24">1 day before</option>
                <option value="48">2 days before</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Language
              </label>
              <select
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value as LanguageOption);
                  setActivePackId(null);
                  setAppliedCards(null);
                }}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-premium-gold/50"
              >
                <option value="en">English</option>
                <option value="fr">Francais</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Folder
              </label>
              <input
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                placeholder="General"
                className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-premium-gold/50"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Pack tags
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                        active
                          ? "border-premium-gold bg-premium-gold/15 text-premium-gold"
                          : "border-white/15 text-slate-300 hover:border-premium-gold/40"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={customTagInput}
                  onChange={(event) => setCustomTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustomTag();
                    }
                  }}
                  placeholder="Add custom tag"
                  className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-premium-gold/50"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-premium-gold/40"
                >
                  Add tag
                </button>
              </div>
            </div>
            <a
              href="https://new.express.adobe.com/"
              target="_blank"
              rel="noreferrer"
              className="self-end rounded-xl bg-premium-gold px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#e3c86b]"
            >
              Open Adobe Express
            </a>
            <Link
              href="/dashboard/listings"
              className="self-end rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-premium-gold/40"
            >
              Open listings
            </Link>
            <button
              type="button"
              onClick={() => void saveContentPack()}
              disabled={savingPack || !selectedListing}
              className="self-end rounded-xl border border-emerald-400/40 px-4 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/10 disabled:opacity-50"
            >
              {savingPack ? "Saving..." : "Save content pack"}
            </button>
            <button
              type="button"
              onClick={() => void saveChangesToCurrentPack()}
              disabled={updatingPack || !selectedListing || !activePackId || activePackId === "custom-edit"}
              className="self-end rounded-xl border border-sky-400/40 px-4 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-500/10 disabled:opacity-50"
            >
              {updatingPack ? "Updating..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => void duplicateCurrentPack()}
              disabled={duplicatingPack || !selectedListing}
              className="self-end rounded-xl border border-premium-gold/40 px-4 py-3 text-sm font-medium text-premium-gold transition hover:bg-premium-gold/10 disabled:opacity-50"
            >
              {duplicatingPack ? "Duplicating..." : "Duplicate pack"}
            </button>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold text-white">Brand pack for creatives</h2>
              <p className="mt-2 text-sm text-slate-400">
                Keep every design aligned with your luxury broker identity before exporting from Adobe Express.
              </p>
              <div className="mt-4 space-y-3">
                {BRAND_TOKENS.map((token) => (
                  <div key={token.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{token.label}</p>
                      <p className="text-xs text-slate-500">{token.value}</p>
                    </div>
                    <span className="h-8 w-8 rounded-full border border-white/10" style={{ backgroundColor: token.value }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold text-white">Selected listing context</h2>
              <div className="mt-3 rounded-xl border border-premium-gold/20 bg-premium-gold/5 p-4">
                <p className="text-sm font-semibold text-white">{selectedListing?.title ?? "No listing selected"}</p>
                <p className="mt-1 text-sm text-slate-400">
                  Code {selectedListing?.listingCode ?? "—"} ·{" "}
                  {selectedListing?.price != null ? `$${selectedListing.price.toLocaleString()} CAD` : "—"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {[selectedListing?.city, selectedListing?.propertyType, selectedListing?.bedrooms ? `${selectedListing.bedrooms} bd` : null, selectedListing?.bathrooms ? `${selectedListing.bathrooms} ba` : null]
                    .filter(Boolean)
                    .join(" · ") || "Limited listing metadata available"}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-premium-gold">
                  Tone: {tone.replace("_", " ")} · Output: {output.replace("_", " ")} · Language: {language}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Broker contact: {brokerContact.phone} · {brokerContact.email}
                </p>
                <p className="mt-2 text-xs text-slate-500">Folder: {folderName.trim() || "General"}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Status: {campaignStatus} {plannedFor ? `· Planned ${new Date(plannedFor).toLocaleString()}` : ""}
                </p>
                <p className="mt-2 text-xs text-slate-500">Reminder: {reminderHoursBefore}h before publish</p>
                <p className="mt-2 text-xs text-slate-500">
                  Tags: {selectedTags.length ? selectedTags.join(", ") : "No tags selected"}
                </p>
                {activePackId ? (
                  <p className="mt-2 text-xs text-emerald-300">Applied saved pack: {activePackId}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold text-white">Favorites</h2>
              <div className="mt-4 space-y-3">
                {favoritePacks.length === 0 ? (
                  <p className="text-sm text-slate-500">Star your best packs to pin them here.</p>
                ) : (
                  favoritePacks.slice(0, 4).map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => applySavedPack(pack)}
                      className="w-full rounded-xl border border-premium-gold/25 bg-premium-gold/5 p-4 text-left transition hover:border-premium-gold/50"
                    >
                      <p className="text-sm font-medium text-white">{pack.title}</p>
                      <p className="mt-1 text-xs text-premium-gold">
                        {pack.folder?.trim() || "General"} · {pack.tags.slice(0, 2).join(", ") || "No tags"}
                      </p>
                      {renderPackActivity(pack, true)}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold text-white">Recently used</h2>
              <div className="mt-4 space-y-3">
                {recentPacks.length === 0 ? (
                  <p className="text-sm text-slate-500">Open a saved pack to start building your recent list.</p>
                ) : (
                  recentPacks.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => applySavedPack(pack)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-premium-gold/40"
                    >
                      <p className="text-sm font-medium text-white">{pack.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Last opened {pack.lastUsedAt ? new Date(pack.lastUsedAt).toLocaleString() : "never"}
                      </p>
                      {renderPackActivity(pack, true)}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold text-white">Reminder inbox</h2>
              <p className="mt-2 text-sm text-slate-400">
                Action upcoming reminder tasks without opening each pack one by one.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-red-400/20 bg-red-500/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-red-200">Due now</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{reminderQueue.dueNow.length}</p>
                  <p className="mt-1 text-xs text-slate-400">Reminder tasks ready for immediate broker follow-up.</p>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">Upcoming reminders</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{reminderQueue.upcoming.length}</p>
                  <p className="mt-1 text-xs text-slate-400">Next reminder tasks approaching their alert window.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {reminderQueue.dueNow.length === 0 && reminderQueue.upcoming.length === 0 ? (
                  <p className="text-sm text-slate-500">No reminder tasks are queued yet.</p>
                ) : (
                  [...reminderQueue.dueNow, ...reminderQueue.upcoming].map((item) => (
                    <div
                      key={`${item.pack.id}-${item.reminderAt.toISOString()}`}
                      className="rounded-xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{item.pack.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Reminder {item.reminderAt.toLocaleString()} · Publish{" "}
                            {item.pack.plannedFor ? new Date(item.pack.plannedFor).toLocaleString() : "No publish time"}
                          </p>
                          {renderPackActivity(item.pack, true)}
                        </div>
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
                            item.isDue
                              ? "border-red-400/30 bg-red-500/10 text-red-200"
                              : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                          }`}
                        >
                          {item.isDue ? "Due now" : "Upcoming"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => applySavedPack(item.pack)}
                          className="rounded-lg border border-emerald-400/30 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/10"
                        >
                          Open pack
                        </button>
                        <button
                          type="button"
                          onClick={() => void dismissReminder(item.pack)}
                          className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-premium-gold/40"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => void reschedulePack(item.pack, 24)}
                          className="rounded-lg border border-amber-400/30 px-3 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-500/10"
                        >
                          Reschedule +1 day
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold text-white">Planned timeline</h2>
              <p className="mt-2 text-sm text-slate-400">
                Review upcoming scheduled content packs by publish day and reopen them quickly for updates.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-red-400/20 bg-red-500/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-red-200">Overdue</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{scheduleHealth.overdue.length}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Planned packs whose publish time has already passed.
                  </p>
                </div>
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-200">Publishing today</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{scheduleHealth.today.length}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Packs scheduled for today and ready for quick review.
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">Up next</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{scheduleHealth.upcoming.length}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Next scheduled campaign packs coming after today.
                  </p>
                </div>
              </div>
              {scheduleHealth.upcoming.length > 0 ? (
                <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Next scheduled packs</p>
                  <div className="mt-3 space-y-2">
                    {scheduleHealth.upcoming.map((pack) => (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => applySavedPack(pack)}
                        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-slate-950/70 px-3 py-3 text-left transition hover:border-premium-gold/40"
                      >
                        <span className="text-sm text-white">{pack.title}</span>
                        <span className="text-xs text-slate-400">
                          {pack.plannedFor ? new Date(pack.plannedFor).toLocaleString() : "No time"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-4 space-y-4">
                {plannedTimelineGroups.length === 0 ? (
                  <p className="text-sm text-slate-500">No planned packs yet. Set a pack to `planned` and choose a publish time.</p>
                ) : (
                  plannedTimelineGroups.map((group) => (
                    <div key={group.dateLabel} className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">
                        {group.dateLabel}
                      </p>
                      <div className="mt-3 space-y-3">
                        {group.packs.map((pack) => (
                          <button
                            key={pack.id}
                            type="button"
                            onClick={() => applySavedPack(pack)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-left transition hover:border-premium-gold/40"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">{pack.title}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {pack.plannedFor ? new Date(pack.plannedFor).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Time not set"}
                                  {" · "}
                                  {pack.folder?.trim() || "General"}
                                  {pack.reminderHoursBefore ? ` · remind ${pack.reminderHoursBefore}h before` : ""}
                                </p>
                                {renderPackActivity(pack, true)}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className="rounded-full border border-premium-gold/30 bg-premium-gold/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-premium-gold">
                                  {pack.tags[0] ?? pack.output ?? "campaign"}
                                </span>
                                <span
                                  className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${getTimelineBadge(pack).className}`}
                                >
                                  {getTimelineBadge(pack).label}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void setReminder(pack, 24);
                                }}
                                className="rounded-lg border border-white/15 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-200 transition hover:border-premium-gold/40"
                              >
                                Remind 1 day before
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void dismissReminder(pack);
                                }}
                                className="rounded-lg border border-white/15 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-200 transition hover:border-premium-gold/40"
                              >
                                Dismiss reminder
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void reschedulePack(pack, 24);
                                }}
                                className="rounded-lg border border-amber-400/30 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-200 transition hover:bg-amber-500/10"
                              >
                                Reschedule +1 day
                              </button>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">Saved packs</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={packSearchQuery}
                    onChange={(event) => setPackSearchQuery(event.target.value)}
                    placeholder="Search title, folder, or tag"
                    className="min-w-[220px] rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-premium-gold/40"
                  />
                  <div className="flex overflow-hidden rounded-lg border border-white/15">
                    <button
                      type="button"
                      onClick={() => setPackLibraryView("grid")}
                      className={`px-3 py-2 text-sm transition ${
                        packLibraryView === "grid" ? "bg-premium-gold/15 text-premium-gold" : "bg-black/30 text-slate-300"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setPackLibraryView("list")}
                      className={`px-3 py-2 text-sm transition ${
                        packLibraryView === "list" ? "bg-premium-gold/15 text-premium-gold" : "bg-black/30 text-slate-300"
                      }`}
                    >
                      List
                    </button>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-premium-gold/40"
                  >
                    <option value="all">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="planned">Planned</option>
                    <option value="posted">Posted</option>
                  </select>
                  <select
                    value={folderFilter}
                    onChange={(event) => setFolderFilter(event.target.value)}
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-premium-gold/40"
                  >
                    <option value="all">All folders</option>
                    {availableFolders.map((folder) => (
                      <option key={folder} value={folder}>
                        {folder}
                      </option>
                    ))}
                  </select>
                  <select
                    value={packTagFilter}
                    onChange={(event) => setPackTagFilter(event.target.value)}
                    className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-premium-gold/40"
                  >
                    <option value="all">All tags</option>
                    {availableTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleLoadSavedPacks()}
                    className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 transition hover:border-premium-gold/40"
                  >
                    {packsLoaded ? "Refresh packs" : "Load packs"}
                  </button>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllVisible}
                    className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-premium-gold/40"
                  >
                    {filteredPacks.length > 0 && filteredPacks.every((pack) => selectedPackIds.includes(pack.id))
                      ? "Unselect visible"
                      : "Select visible"}
                  </button>
                  <span className="text-xs text-slate-500">{selectedPackCount} selected</span>
                  <input
                    value={bulkFolderName}
                    onChange={(event) => setBulkFolderName(event.target.value)}
                    placeholder="Move selected to folder"
                    className="min-w-[180px] rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-premium-gold/40"
                  />
                  <button
                    type="button"
                    onClick={() => void bulkUpdateSelectedPacks("folder")}
                    disabled={bulkUpdating || selectedPackCount === 0}
                    className="rounded-lg border border-sky-400/30 px-3 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-500/10 disabled:opacity-50"
                  >
                    {bulkUpdating ? "Saving..." : "Move folder"}
                  </button>
                  <input
                    value={bulkTagInput}
                    onChange={(event) => setBulkTagInput(event.target.value)}
                    placeholder="Add tag to selected"
                    className="min-w-[180px] rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-premium-gold/40"
                  />
                  <button
                    type="button"
                    onClick={() => void bulkUpdateSelectedPacks("tag")}
                    disabled={bulkUpdating || selectedPackCount === 0 || !bulkTagInput.trim()}
                    className="rounded-lg border border-premium-gold/30 px-3 py-2 text-xs font-medium text-premium-gold transition hover:bg-premium-gold/10 disabled:opacity-50"
                  >
                    {bulkUpdating ? "Saving..." : "Add tag"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void bulkDeleteSelectedPacks()}
                    disabled={bulkDeleting || selectedPackCount === 0}
                    className="rounded-lg border border-red-400/30 px-3 py-2 text-xs font-medium text-red-100 transition hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {bulkDeleting ? "Deleting..." : "Delete selected"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void bulkDuplicateSelectedPacks()}
                    disabled={bulkDuplicating || selectedPackCount === 0}
                    className="rounded-lg border border-emerald-400/30 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/10 disabled:opacity-50"
                  >
                    {bulkDuplicating ? "Duplicating..." : "Duplicate selected"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void copySelectedPackSummary()}
                    disabled={selectedPackCount === 0}
                    className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-premium-gold/40 disabled:opacity-50"
                  >
                    {bulkCopied ? "Copied" : "Copy selected summary"}
                  </button>
                </div>
              </div>
              <div className={packLibraryView === "grid" ? "mt-4 grid gap-4 md:grid-cols-2" : "mt-4 space-y-3"}>
                {filteredPacks.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {packsLoaded ? "No saved packs match your search or filters yet." : "Load saved packs for this listing."}
                  </p>
                ) : (
                  filteredPacks.map((pack) => (
                    <div key={pack.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <label className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                        <input
                          type="checkbox"
                          checked={selectedPackIds.includes(pack.id)}
                          onChange={() => togglePackSelection(pack.id)}
                          className="h-4 w-4 rounded border border-white/20 bg-slate-950"
                        />
                        Select pack
                      </label>
                      {packLibraryView === "grid" ? renderPackPreview(pack) : null}
                      <div className={packLibraryView === "grid" ? "mt-4" : ""}>
                        <p className="text-sm font-medium text-white">{pack.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {pack.tone} · {pack.output} · {pack.language} · {new Date(pack.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-emerald-300">
                          {pack.campaignStatus}
                          {pack.plannedFor ? ` · ${new Date(pack.plannedFor).toLocaleString()}` : ""}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                          Folder: {pack.folder?.trim() || "General"}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {pack.cards.length} content cards saved
                        </p>
                        {renderPackActivity(pack)}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {pack.tags?.map((tag) => (
                            <span
                              key={`${pack.id}-${tag}`}
                              className="rounded-full border border-premium-gold/30 bg-premium-gold/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-premium-gold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => applySavedPack(pack)}
                          className="mt-3 rounded-lg border border-emerald-400/40 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/10"
                        >
                          Apply pack
                        </button>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void toggleFavorite(pack)}
                            disabled={favoritingPackId === pack.id}
                            className="rounded-lg border border-premium-gold/30 px-3 py-2 text-xs font-medium text-premium-gold transition hover:bg-premium-gold/10 disabled:opacity-50"
                          >
                            {favoritingPackId === pack.id ? "Saving..." : pack.isFavorite ? "Unstar" : "Star"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void persistPackMeta(pack, {
                                campaignStatus:
                                  pack.campaignStatus === "draft"
                                    ? "ready"
                                    : pack.campaignStatus === "ready"
                                      ? "planned"
                                      : pack.campaignStatus === "planned"
                                        ? "posted"
                                        : "draft",
                              })
                            }
                            className="rounded-lg border border-emerald-400/30 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/10"
                          >
                            Next status
                          </button>
                          <button
                            type="button"
                            onClick={() => void renamePack(pack)}
                            disabled={renamingPackId === pack.id}
                            className="rounded-lg border border-sky-400/30 px-3 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-500/10 disabled:opacity-50"
                          >
                            {renamingPackId === pack.id ? "Renaming..." : "Rename"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void deletePack(pack)}
                            disabled={deletingPackId === pack.id}
                            className="rounded-lg border border-red-400/30 px-3 py-2 text-xs font-medium text-red-100 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {deletingPackId === pack.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            {visibleCards.map((card) => (
              <article key={card.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
                      {card.format}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{card.title}</h2>
                    <p className="mt-1 text-sm text-slate-400">{card.goal}</p>
                  </div>
                  <a
                    href={card.adobeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-premium-gold/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold transition hover:bg-premium-gold/10"
                  >
                    Open in Adobe Express
                  </a>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 lg:col-span-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Headline</p>
                    <textarea
                      value={card.headline}
                      onChange={(event) => updateVisibleCard(card.id, "headline", event.target.value)}
                      className="mt-2 min-h-[88px] w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-100 outline-none transition focus:border-premium-gold/40"
                    />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 lg:col-span-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Caption body</p>
                    <textarea
                      value={card.body}
                      onChange={(event) => updateVisibleCard(card.id, "body", event.target.value)}
                      className="mt-2 min-h-[160px] w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm leading-6 text-slate-300 outline-none transition focus:border-premium-gold/40"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">CTA</p>
                  <textarea
                    value={card.cta}
                    onChange={(event) => updateVisibleCard(card.id, "cta", event.target.value)}
                    className="mt-2 min-h-[84px] w-full rounded-lg border border-emerald-500/20 bg-slate-950 px-3 py-2 text-sm text-emerald-100 outline-none transition focus:border-emerald-400/50"
                  />
                </div>

                <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-300">Hero suggestion</p>
                  <textarea
                    value={card.heroSuggestion}
                    onChange={(event) =>
                      updateVisibleCard(card.id, "heroSuggestion", event.target.value)
                    }
                    className="mt-2 min-h-[108px] w-full rounded-lg border border-sky-500/20 bg-slate-950 px-3 py-2 text-sm text-sky-100 outline-none transition focus:border-sky-400/50"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void copyCard(card)}
                    className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/15"
                  >
                    {copiedId === card.id ? "Copied" : "Copy content"}
                  </button>
                  <a
                    href={card.adobeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#e3c86b]"
                  >
                    Design in Adobe Express
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
