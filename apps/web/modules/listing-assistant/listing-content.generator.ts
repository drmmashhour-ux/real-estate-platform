import type { GeneratedListingContent, ListingLanguage, ListingPropertyPartial } from "@/modules/listing-assistant/listing-assistant.types";

function nz(s: string | undefined, fallback: string): string {
  const t = s?.trim();
  return t && t.length > 0 ? t : fallback;
}

type L = ListingLanguage;

const COPY: Record<
  L,
  {
    priceListed: (n: string) => string;
    priceTbd: string;
    presenting: (seed: string, typeLower: string, city: string) => string;
    highlights: string;
    nextSteps: string;
    amenity1: string;
    amenity2: string;
    amenity3: string;
    zonaDefault: string;
    disclaim1: string;
    disclaim2: string;
    disclaim3: string;
    disclaim4: string;
    ksp1: (city: string) => string;
    ksp2: string;
    ksp3: string;
    bdFlex: string;
    baFlex: string;
    dimFlex: string;
    locPrefix: string;
    brokerNotes: string;
    bedrooms: (n: number) => string;
    bathrooms: (n: number) => string;
    sqft: (n: string) => string;
    familyBuyers: string;
    ftsBuyers: string;
    neutralBuyers: string;
  }
> = {
  en: {
    priceListed: (n) => `Listed near $${n}`,
    priceTbd: "Pricing to be confirmed with your brokerage",
    presenting: (seed, typeLower, city) =>
      `Presenting ${seed} — an opportunity for buyers seeking a ${typeLower} lifestyle in ${city}.`,
    highlights: "Highlights:",
    nextSteps:
      "Suggested next steps for buyers: schedule a verified visit, review declarations and certificates, and confirm financing with a licensed professional.",
    amenity1: "Confirm inclusions/exclusions with seller declaration",
    amenity2: "Parking / storage — verify condominium documents if applicable",
    amenity3: "Heating, windows, roof age — diligence items for visits",
    zonaDefault:
      "Confirm zoning designation and permitted uses with municipal registry or notary referral — assistant text is non-binding.",
    disclaim1: "This text is generated for drafting only. It is not legal, tax, or agency advice.",
    disclaim2: "No guarantee of square footage, revenue, appreciation, or financing.",
    disclaim3:
      "Syndication (incl. Centris) requires broker confirmation and compliant data entry — never auto-submit from LECIPM.",
    disclaim4:
      "Co-ownership listings require mandatory declarations and insurer-aligned wording — verify locally.",
    ksp1: (city) => `Strong ${city} positioning — tailor to your comps`,
    ksp2: "Highlight transportation, schools, or amenities only when verified",
    ksp3: "Use measured photo order and disclosures per brokerage policy",
    bdFlex: "Flexible layout — confirm room count",
    baFlex: "Bathroom count — verify with declarations",
    dimFlex: "Dimensions — verify with municipal records",
    locPrefix: "Location:",
    brokerNotes: "Broker notes (provided):",
    bedrooms: (n) => `${n} bedrooms`,
    bathrooms: (n) => `${n} bathrooms`,
    sqft: (n) => `${n} sq ft (verify)`,
    familyBuyers: "Families and move-up buyers prioritizing space and neighbourhood stability",
    ftsBuyers: "First-time buyers or downsizers — confirm strata / condo fees where applicable",
    neutralBuyers: "Buyer profile depends on verified property facts — refine after declaration review",
  },
  fr: {
    priceListed: (n) => `Affiché près de ${n} $`,
    priceTbd: "Prix à confirmer avec votre courtage",
    presenting: (seed, typeLower, city) =>
      `Présentation : ${seed} — une opportunité pour les acheteurs recherchant un style de vie de type ${typeLower} à ${city}.`,
    highlights: "Points saillants :",
    nextSteps:
      "Prochaines étapes suggérées : visite vérifiée, examen des déclarations et certificats, confirmation du financement avec un professionnel autorisé.",
    amenity1: "Confirmer inclusions/exclusions avec la déclaration du vendeur",
    amenity2: "Stationnement / rangement — vérifier les documents de copropriété le cas échéant",
    amenity3: "Chauffage, fenêtres, toiture — sujets de diligence pour les visites",
    zonaDefault:
      "Confirmer le zonage et les usages permis auprès du registre municipal ou d’un notaire — texte d’aide sans valeur légale.",
    disclaim1: "Texte généré à des fins de brouillon seulement — pas un avis juridique, fiscal ou d’agence.",
    disclaim2: "Aucune garantie sur superficie, revenus, appréciation ou financement.",
    disclaim3:
      "La syndication (incl. Centris) exige validation du courtier et saisie conforme — jamais de publication automatique depuis LECIPM.",
    disclaim4:
      "Copropriété : déclarations obligatoires et formulations alignées assureurs — valider localement.",
    ksp1: (city) => `Positionnement ${city} — ajuster selon comparables`,
    ksp2: "Mettre en avant transport, écoles ou services seulement si vérifiés",
    ksp3: "Ordre des photos et divulgations selon les politiques du courtage",
    bdFlex: "Aménagement à confirmer — nombre de chambres",
    baFlex: "Nombre de salles de bain — vérifier aux déclarations",
    dimFlex: "Dimensions — vérifier aux registres municipaux",
    locPrefix: "Emplacement :",
    brokerNotes: "Notes du courtier (fournies) :",
    bedrooms: (n) => `${n} chambres`,
    bathrooms: (n) => `${n} salles de bain`,
    sqft: (n) => `${n} pi² (à vérifier)`,
    familyBuyers: "Familles et acheteurs en progression recherchant espace et stabilité",
    ftsBuyers: "Premiers acheteurs ou rabattement — frais de copropriété à confirmer",
    neutralBuyers: "Profil acheteur à affiner selon les faits vérifiés et la déclaration",
  },
  ar: {
    priceListed: (n) => `معروض بالقرب من ${n} $`,
    priceTbd: "التسعير يُؤكَّد مع الوسيط",
    presenting: (seed, typeLower, city) =>
      `نقدّم ${seed} — فرصة للمشترين الباحثين عن نمط حياة ${typeLower} في ${city}.`,
    highlights: "أبرز النقاط:",
    nextSteps:
      "خطوات مقترحة للمشترين: جدولة زيارة موثّقة، مراجعة الإقرارات والشهادات، والتحقق من التمويل مع مختص مرخّص.",
    amenity1: "تأكيد شامل/غير شامل مع إقرار البائع",
    amenity2: "موقف / تخزين — التحقق من وثائق الشقق المشتركة عند الحاجة",
    amenity3: "تدفئة، نوافذ، عمر السقف — نقاط للعناية أثناء الزيارات",
    zonaDefault:
      "تأكيد التصنيف الزونينغ والاستخدامات المسموحة من السجل البلدي أو عبر الوسيط القانوني — النص إرشادي فقط.",
    disclaim1: "النص للمسودة فقط وليس استشارة قانونية أو ضريبية أو وساطة.",
    disclaim2: "لا ضمان للمساحة أو الدخل أو التقدير أو التمويل.",
    disclaim3:
      "النشر الخارجي (بما فيه Centris) يتطلب تأكيد الوسيط وإدخالاً متوافقاً — لا نشر تلقائي من LECIPM.",
    disclaim4:
      "الملكية المشتركة تتطلب إقرارات إلزامية وصياغة متوافقة مع التأمين — راجع محلياً.",
    ksp1: (city) => `موقع قوي في ${city} — ضبط حسب المقارنات`,
    ksp2: "اذكر النقل والمدارس عند التحقق فقط",
    ksp3: "ترتيب الصور والإفصاح حسب سياسة الوساطة",
    bdFlex: "تخطيط مرن — تأكيد عدد الغرف",
    baFlex: "عدد الحمامات — تحقق من الإقرارات",
    dimFlex: "المقاسات — تحقق من السجلات البلدية",
    locPrefix: "الموقع:",
    brokerNotes: "ملاحظات الوسيط (مقدَّمة):",
    bedrooms: (n) => `${n} غرف نوم`,
    bathrooms: (n) => `${n} حمامات`,
    sqft: (n) => `${n} قدم² (يُتحقَّق)`,
    familyBuyers: "عائلات ومشترون يبحثون عن مساحة واستقرار",
    ftsBuyers: "مشترون لأول مرة أو تقليص — تحقق من رسوم الشقق المشتركة",
    neutralBuyers: "الفئة المستهدفة تعتمد على الحقائق المؤكَّدة — راجع الإقرار",
  },
};

/**
 * Multilingual deterministic listing copy — auditable templates.
 */
export function generateListingContent(
  property: ListingPropertyPartial,
  language: ListingLanguage = "en",
): GeneratedListingContent {
  const lang = language in COPY ? language : "en";
  const c = COPY[lang];

  const city = nz(property.city, "[city]");
  const region = nz(property.region, "QC");
  const typeLabel = nz(property.listingType, "residential").replace(/_/g, " ");
  const typeLower = typeLabel.toLowerCase();
  const bd = property.bedrooms ?? null;
  const ba = property.bathrooms ?? null;
  const sqft = property.sqft ?? null;
  const price =
    property.priceMajor != null && property.priceMajor > 0
      ? c.priceListed(Math.round(property.priceMajor).toLocaleString())
      : c.priceTbd;

  const titleSeed = nz(property.title, `${bd ? `${bd} · ` : ""}${typeLabel} · ${city}`);
  const title =
    titleSeed.length > 80 ? `${titleSeed.slice(0, 77)}…` : `${titleSeed} · ${city}`;

  const highlights = [
    bd ? c.bedrooms(bd) : c.bdFlex,
    ba ? c.bathrooms(ba) : c.baFlex,
    sqft ? c.sqft(sqft.toLocaleString()) : c.dimFlex,
    `${c.locPrefix} ${city}, ${region}`,
    price,
  ].filter(Boolean) as string[];

  const amenities = [c.amenity1, c.amenity2, c.amenity3];

  const zoningNotes = nz(property.zoningNotes, c.zonaDefault);

  const disclaimers = [c.disclaim1, c.disclaim2, c.disclaim3, c.disclaim4];

  const description = [
    c.presenting(titleSeed, typeLower, city),
    "",
    c.highlights,
    ...highlights.map((h) => `• ${h}`),
    "",
    c.nextSteps,
    "",
    property.existingDescription ? `${c.brokerNotes}\n${property.existingDescription.slice(0, 2000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const centrisFormHints = {
    description,
    propertyHighlights: highlights.join("\n"),
    amenities: amenities.join("\n"),
    zoningNotes,
    disclaimers: disclaimers.join("\n"),
  };

  const keySellingPoints = [c.ksp1(city), c.ksp2, c.ksp3];

  const targetBuyerProfile =
    bd && bd >= 3 ? c.familyBuyers : bd === 2 || bd === 1 ? c.ftsBuyers : c.neutralBuyers;

  return {
    title,
    description,
    propertyHighlights: highlights,
    amenities,
    zoningNotes,
    disclaimers,
    keySellingPoints,
    targetBuyerProfile,
    centrisFormHints,
    language: lang,
  };
}
