"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PhoneCallUs } from "@/components/phone/PhoneCallUs";
import { predictUnitPrice } from "@/lib/ai/unit-pricing";
import { matchBuyerToProjects } from "@/lib/ai/matching";

const ProjectsMap = dynamic(
  () => import("@/components/projects/ProjectsMap").then((m) => m.ProjectsMap),
  { ssr: false, loading: () => <div className="flex h-[400px] items-center justify-center rounded-2xl bg-slate-900 text-slate-400">Chargement de la carte…</div> }
);
const ProjectsGoogleMap = dynamic(
  () => import("@/components/projects/ProjectsGoogleMap").then((m) => m.ProjectsGoogleMap),
  { ssr: false, loading: () => <div className="flex h-[400px] items-center justify-center rounded-2xl bg-slate-900 text-slate-400">Chargement de la carte…</div> }
);

const HAS_GOOGLE_MAPS = typeof process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === "string" &&
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.trim().length > 0;

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  "family-house": "Maison",
  condo: "Condo",
  "loft-studio": "Loft / Studio",
  plex: "Plex",
  intergenerational: "Intergénérationnel",
  "mobile-house": "Maison mobile",
  fermette: "Fermette",
  chalet: "Chalet",
  land: "Terrain",
};
const LISTING_TYPE_LABELS: Record<string, string> = {
  "for-sale": "à vendre",
  "for-rent": "à louer",
};

type Project = {
  id: string;
  name: string;
  description: string;
  city: string;
  address: string;
  developer: string;
  deliveryDate: string;
  startingPrice: number;
  status: string;
  heroImage?: string | null;
  featured?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  propertyType?: string | null;
  category?: string | null;
  listingType?: string | null;
  bedroomsMin?: number | null;
  bathroomsMin?: number | null;
  garageCount?: number | null;
  parkingOutside?: number | null;
  storageUnit?: boolean | null;
  pool?: boolean | null;
  elevator?: boolean | null;
  adaptedMobility?: boolean | null;
  waterfront?: boolean | null;
  waterAccess?: boolean | null;
  navigableWater?: boolean | null;
  resort?: boolean | null;
  petsAllowed?: boolean | null;
  smokingAllowed?: boolean | null;
  livingAreaMin?: number | null;
  livingAreaMax?: number | null;
  constructionYearMin?: number | null;
  constructionYearMax?: number | null;
  newConstruction?: boolean | null;
  centuryHistoric?: boolean | null;
  bungalow?: boolean | null;
  multiStorey?: boolean | null;
  splitLevel?: boolean | null;
  detached?: boolean | null;
  semiDetached?: boolean | null;
  attached?: boolean | null;
  plexType?: string | null;
  landAreaMin?: number | null;
  landAreaMax?: number | null;
  moveInDate?: string | null;
  openHouses?: boolean | null;
  repossession?: boolean | null;
  pedestrianFriendly?: boolean | null;
  transitFriendly?: boolean | null;
  carFriendly?: boolean | null;
  groceryNearby?: boolean | null;
  primarySchoolsNearby?: boolean | null;
  secondarySchoolsNearby?: boolean | null;
  daycaresNearby?: boolean | null;
  restaurantsNearby?: boolean | null;
  cafesNearby?: boolean | null;
  nightlifeNearby?: boolean | null;
  shoppingNearby?: boolean | null;
  quiet?: boolean | null;
  vibrant?: boolean | null;
  units: { id: string; type: string; price: number; size: number; status: string }[];
  subscription?: { plan?: string } | null;
};

type BuyerMatch = {
  projectId: string;
  matchScore: number;
  reasons: string[];
  recommendedUnitId: string | null;
};

type Analysis = {
  score: number;
  recommendation: string;
  rentalYield: number;
  expectedAppreciation: number;
  bestUnit: { id: string; type: string; price: number; size: number } | null;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertForm, setAlertForm] = useState({ city: "", maxPrice: "", minPrice: "", deliveryYear: "", alertType: "new-project" });
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [reserveUnitId, setReserveUnitId] = useState<string | null>(null);
  const [reserveForm, setReserveForm] = useState({ fullName: "", email: "", phone: "", note: "" });
  const [reserveSubmitting, setReserveSubmitting] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState<string | null>(null);
  const [matchInfo, setMatchInfo] = useState<BuyerMatch | null>(null);

  const fetchProject = useCallback(() => {
    if (!id) return;
    fetch(`/api/projects/${id}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => (d?.id ? setProject(d) : setProject(null)))
      .catch(() => setProject(null));
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (!id) return;
    fetch("/api/projects/favorites", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const ids = new Set(list.map((f: { projectId?: string }) => f.projectId).filter(Boolean));
        setIsFavorite(ids.has(id));
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!project) return;
    const matches = matchBuyerToProjects(
      { userId: "demo-user", cityPreference: project.city, maxBudget: project.startingPrice * 1.35, investmentGoal: "appreciation" },
      [project],
      { [project.id]: project.units ?? [] }
    );
    setMatchInfo(matches[0] ?? null);
  }, [project]);

  const toggleFavorite = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      if (next) {
        await fetch("/api/projects/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id }), credentials: "same-origin" });
      } else {
        await fetch(`/api/projects/favorites?projectId=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" });
      }
    } catch {
      setIsFavorite(!next);
    }
  };

  const submitAlert = async () => {
    setAlertSubmitting(true);
    try {
      const res = await fetch("/api/projects/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          city: alertForm.city || undefined,
          maxPrice: alertForm.maxPrice ? Number(alertForm.maxPrice) : undefined,
          minPrice: alertForm.minPrice ? Number(alertForm.minPrice) : undefined,
          deliveryYear: alertForm.deliveryYear ? Number(alertForm.deliveryYear) : undefined,
          alertType: alertForm.alertType,
        }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Failed to create alert.");
        return;
      }
      setAlertOpen(false);
      setAlertForm({ city: "", maxPrice: "", minPrice: "", deliveryYear: "", alertType: "new-project" });
      alert("Alert created. We’ll notify you when there are updates.");
    } finally {
      setAlertSubmitting(false);
    }
  };

  const submitReservation = async () => {
    if (!reserveUnitId || !reserveForm.fullName.trim() || !reserveForm.email.trim() || !reserveForm.phone.trim()) {
      alert("Please fill in full name, email, and phone.");
      return;
    }
    setReserveSubmitting(true);
    try {
      const res = await fetch("/api/projects/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          projectUnitId: reserveUnitId,
          fullName: reserveForm.fullName.trim(),
          email: reserveForm.email.trim(),
          phone: reserveForm.phone.trim(),
          note: reserveForm.note.trim() || undefined,
        }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Failed to submit reservation.");
        return;
      }
      setReserveSuccess(reserveUnitId);
      setReserveUnitId(null);
      setReserveForm({ fullName: "", email: "", phone: "", note: "" });
      fetchProject();
    } finally {
      setReserveSubmitting(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    setAnalysisLoading(true);
    fetch(`/api/ai/project-analysis?projectId=${encodeURIComponent(id)}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setAnalysis(d))
      .catch(() => setAnalysis({ score: 50, recommendation: "Moderate", rentalYield: 0.05, expectedAppreciation: 0.05, bestUnit: null }))
      .finally(() => setAnalysisLoading(false));
  }, [id]);

  const submitLead = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/lecipm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, projectId: id }),
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      alert("Request sent! We will contact you soon.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" }) : "—";
  const formatPrice = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")} M $` : v >= 1_000 ? `${(v / 1_000).toFixed(0)} k $` : `${v.toLocaleString()} $`;
  const listingTitle = (p: Project) => {
    const type = (p.propertyType && PROPERTY_TYPE_LABELS[p.propertyType]) || "Propriété";
    const listing = (p.listingType && LISTING_TYPE_LABELS[p.listingType]) || "à vendre";
    return `${type} ${listing}`;
  };
  const heroUrl = project?.heroImage || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600";
  const buildingStyles: string[] = [];
  if (project?.newConstruction) buildingStyles.push("Nouvelle construction");
  if (project?.centuryHistoric) buildingStyles.push("Centenaire/Historique");
  if (project?.bungalow) buildingStyles.push("Plain-pied");
  if (project?.multiStorey) buildingStyles.push("À étages");
  if (project?.splitLevel) buildingStyles.push("Paliers multiples");
  if (project?.detached) buildingStyles.push("Détaché");
  if (project?.semiDetached) buildingStyles.push("Jumelé");
  if (project?.attached) buildingStyles.push("En rangée");
  const constructionYear = project?.constructionYearMin ?? project?.constructionYearMax;
  const landAreaSqft = project?.landAreaMin ?? project?.landAreaMax;

  if (!id) {
    return (
      <main className="min-h-screen bg-[#0a0e17] px-4 py-10 text-white">
        <p>Invalid project.</p>
        <Link href="/projects" className="text-teal-400 hover:underline">← Projects</Link>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#0a0e17] px-4 py-10 text-white">
        <p>Loading…</p>
        <Link href="/projects" className="text-teal-400 hover:underline">← Projects</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0e17] text-slate-50">
      {/* 1. HERO */}
      <section className="relative h-[70vh] min-h-[400px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${heroUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:px-16">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold uppercase tracking-wider text-teal-400">
                {project.status.replace(/-/g, " ")}
              </p>
              {project.featured && (
                <span className="rounded-full bg-[#C9A96E] px-3 py-0.5 text-xs font-semibold text-slate-950">Featured</span>
              )}
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-400">{listingTitle(project)}</p>
            <h1 className="mt-1 text-3xl font-bold text-white md:text-4xl">{project.address || project.name}</h1>
            <p className="mt-1 text-lg text-slate-300">{project.city}{project.address ? ` · ${project.name}` : ` · ${project.developer}`}</p>
            <div className="mt-4 flex flex-wrap gap-6 text-sm">
              <span className="font-semibold text-teal-400">{formatPrice(project.startingPrice)}</span>
              <span className="text-slate-400">Livraison {formatDate(project.deliveryDate)}</span>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#units-table"
                className="rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-teal-400 active:scale-[0.98]"
              >
                Voir les unités
              </a>
              <a
                href="#lead-form"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-all duration-200 hover:bg-white/20 active:scale-[0.98]"
              >
                Demander des renseignements
              </a>
              <button
                type="button"
                onClick={toggleFavorite}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                className="rounded-xl border border-white/30 bg-white/10 p-3 text-white backdrop-blur transition-all duration-200 hover:bg-white/20"
              >
                {isFavorite ? (
                  <svg className="h-6 w-6 fill-red-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L12 6.343l3.172-3.171a4 4 0 115.656 5.656L12 17.657l-8.828-8.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                ) : (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => setAlertOpen(true)}
                className="rounded-xl border border-teal-500/50 bg-teal-500/10 px-6 py-3 text-sm font-semibold text-teal-400 transition-all duration-200 hover:bg-teal-500/20"
              >
                Créer une alerte
              </button>
              <span className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm">
                <PhoneCallUs showLabel={true} />
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/projects"
          className="mb-8 inline-block text-sm font-medium text-teal-400 transition-colors hover:text-teal-300"
        >
          ← Tous les projets
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Caractéristiques */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-white">Caractéristiques</h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
                {project.bedroomsMin != null && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Chambres</dt>
                    <dd className="text-slate-200">{project.bedroomsMin} chambre(s) ou +</dd>
                  </>
                )}
                {project.bathroomsMin != null && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Salles de bain</dt>
                    <dd className="text-slate-200">{project.bathroomsMin} ou +</dd>
                  </>
                )}
                {buildingStyles.length > 0 && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Style de bâtiment</dt>
                    <dd className="text-slate-200">{buildingStyles.join(", ")}</dd>
                  </>
                )}
                {constructionYear != null && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Année de construction</dt>
                    <dd className="text-slate-200">{constructionYear}</dd>
                  </>
                )}
                {landAreaSqft != null && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Superficie du terrain</dt>
                    <dd className="text-slate-200">{landAreaSqft.toLocaleString()} pc</dd>
                  </>
                )}
                {((project.garageCount != null && project.garageCount > 0) || (project.parkingOutside != null && project.parkingOutside > 0)) && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Stationnement</dt>
                    <dd className="text-slate-200">
                      {project.garageCount && project.garageCount > 0 ? `Garage ${project.garageCount}` : ""}
                      {project.garageCount && project.garageCount > 0 && project.parkingOutside && project.parkingOutside > 0 ? " · " : ""}
                      {project.parkingOutside && project.parkingOutside > 0 ? `Extérieur ${project.parkingOutside}` : ""}
                    </dd>
                  </>
                )}
                {project.pool && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Piscine</dt>
                    <dd className="text-slate-200">Oui</dd>
                  </>
                )}
                {project.elevator && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Ascenseur</dt>
                    <dd className="text-slate-200">Oui</dd>
                  </>
                )}
                {project.adaptedMobility && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Adapté mobilité réduite</dt>
                    <dd className="text-slate-200">Oui</dd>
                  </>
                )}
                {project.waterfront && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Bord à l&apos;eau</dt>
                    <dd className="text-slate-200">Oui</dd>
                  </>
                )}
                {project.moveInDate && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Date d&apos;emménagement</dt>
                    <dd className="text-slate-200">{formatDate(project.moveInDate)}</dd>
                  </>
                )}
                {project.openHouses && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Visites libres</dt>
                    <dd className="text-slate-200">Oui</dd>
                  </>
                )}
                {project.repossession && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Reprise de finance</dt>
                    <dd className="text-slate-200">Oui</dd>
                  </>
                )}
              </dl>
              {project.bedroomsMin == null && project.bathroomsMin == null && buildingStyles.length === 0 && constructionYear == null && landAreaSqft == null && !project.pool && !project.elevator && !project.adaptedMobility && !project.waterfront && !project.moveInDate && !project.openHouses && !project.repossession && (project.garageCount == null || project.garageCount === 0) && (project.parkingOutside == null || project.parkingOutside === 0) && (
                <p className="mt-4 text-slate-500">Aucune caractéristique renseignée pour le moment.</p>
              )}
            </section>

            {/* Style de vie */}
            {(project.pedestrianFriendly ?? project.transitFriendly ?? project.carFriendly ?? project.groceryNearby ?? project.primarySchoolsNearby ?? project.restaurantsNearby ?? project.quiet ?? project.vibrant) && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl">
                <h2 className="text-xl font-semibold text-white">Style de vie</h2>
                <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                  {(project.pedestrianFriendly || project.transitFriendly || project.carFriendly) && (
                    <>
                      <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Transport</dt>
                      <dd className="text-slate-200">
                        {[project.pedestrianFriendly && "Piétons", project.transitFriendly && "Transport en commun", project.carFriendly && "Automobile"].filter(Boolean).join(", ")}
                      </dd>
                    </>
                  )}
                  {(project.groceryNearby || project.primarySchoolsNearby || project.restaurantsNearby || project.cafesNearby || project.shoppingNearby) && (
                    <>
                      <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Services à proximité</dt>
                      <dd className="text-slate-200">
                        {[project.groceryNearby && "Épiceries", project.primarySchoolsNearby && "Écoles", project.daycaresNearby && "Garderies", project.restaurantsNearby && "Restaurants", project.cafesNearby && "Cafés", project.nightlifeNearby && "Nightlife", project.shoppingNearby && "Magasinage"].filter(Boolean).join(", ")}
                      </dd>
                    </>
                  )}
                  {(project.quiet || project.vibrant) && (
                    <>
                      <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Caractère</dt>
                      <dd className="text-slate-200">{[project.quiet && "Silencieux", project.vibrant && "Dynamique"].filter(Boolean).join(", ")}</dd>
                    </>
                  )}
                </dl>
              </section>
            )}

            {/* Description */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-white">Description</h2>
              <p className="mt-4 text-slate-300 leading-relaxed">{project.description}</p>
              <p className="mt-4 text-xs text-slate-500">No {project.id}</p>
              <p className="mt-6 text-sm font-medium text-white">Besoin de plus de détails?</p>
              <p className="mt-1 text-slate-400 text-sm">Visitez le site du courtier immobilier ou envoyez une demande d&apos;info ci‑dessous.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="#lead-form" className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-teal-400">Demander des renseignements</a>
                <span className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm"><PhoneCallUs showLabel={true} /></span>
              </div>
            </section>

            {/* Détails financiers (placeholder) */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-white">Détails financiers</h2>
              <p className="mt-2 text-slate-500 text-sm">Évaluation municipale et taxes disponibles sur demande auprès du courtier.</p>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Prix affiché</dt>
                  <dd className="mt-1 font-semibold text-teal-400">{formatPrice(project.startingPrice)}</dd>
                </div>
              </dl>
            </section>

            {/* Courtier inscripteur */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-white">Courtier inscripteur</h2>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
                <p className="font-semibold text-white">{project.developer}</p>
                <p className="text-sm text-slate-400">Promoteur / Contact projet</p>
                <p className="mt-2 text-slate-300">{project.address}</p>
                <div className="mt-3">
                  <PhoneCallUs showLabel={true} />
                </div>
              </div>
            </section>

            {/* Localisation */}
            {(project.latitude != null && project.longitude != null) && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-xl">
                <h2 className="border-b border-white/10 px-8 py-5 text-xl font-semibold text-white">Localisation</h2>
                <p className="px-8 pt-2 text-xs text-slate-500">Conformément à nos conditions d&apos;utilisation, les données de localisation vous sont fournies « telles quelles », sans aucune garantie.</p>
                <div className="h-[400px] w-full">
                  {HAS_GOOGLE_MAPS ? (
                    <ProjectsGoogleMap projects={[project]} className="h-full w-full" />
                  ) : (
                    <ProjectsMap projects={[project]} className="h-full w-full" />
                  )}
                </div>
              </section>
            )}

            {/* Découvrez [sector] */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-white">Découvrez {project.city}</h2>
              <p className="mt-3 text-slate-400 text-sm">Secteur recherché. Demandez les statistiques du quartier (population, densité, transport) au courtier.</p>
            </section>

            {/* Calcul des versements */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-white">Calcul des versements hypothécaires</h2>
              <p className="mt-2 text-slate-500 text-sm">La calculatrice et toute donnée affichée sont fournies à titre indicatif.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-500">Coût de la propriété</p>
                  <p className="mt-1 font-semibold text-teal-400">{formatPrice(project.startingPrice)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-500">Calcul des versements</p>
                  <p className="mt-1 text-slate-300 text-sm">Sur demande</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-500">Droits de mutation</p>
                  <p className="mt-1 text-slate-300 text-sm">Sur demande</p>
                </div>
              </div>
            </section>

            {/* 3. UNITS TABLE */}
            {project.units && project.units.length > 0 && (
              <section id="units-table" className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-xl">
                <h2 className="border-b border-white/10 px-8 py-5 text-xl font-semibold text-white">
                  Units
                </h2>
                {reserveSuccess && (
                  <div className="mx-8 mt-4 rounded-xl bg-teal-500/20 px-4 py-3 text-sm text-teal-300">
                    Reservation request submitted. We’ll contact you shortly.
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-xs font-medium uppercase tracking-wider text-slate-500">
                        <th className="px-8 py-4">Type</th>
                        <th className="px-8 py-4">Size (m²)</th>
                        <th className="px-8 py-4">Price</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.units.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                          <td className="px-8 py-4 font-medium text-white">{u.type}</td>
                          <td className="px-8 py-4 text-slate-300">{u.size}</td>
                          <td className="px-8 py-4 font-semibold text-teal-400">${u.price.toLocaleString()}</td>
                          <td className="px-8 py-4">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.status === "available" ? "bg-teal-500/20 text-teal-400" : "bg-slate-500/20 text-slate-400"}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-8 py-4">
                            {u.status === "available" ? (
                              reserveUnitId === u.id ? (
                                <div className="min-w-[240px] space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                                  <input
                                    type="text"
                                    placeholder="Full name"
                                    value={reserveForm.fullName}
                                    onChange={(e) => setReserveForm((f) => ({ ...f, fullName: e.target.value }))}
                                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                                  />
                                  <input
                                    type="email"
                                    placeholder="Email"
                                    value={reserveForm.email}
                                    onChange={(e) => setReserveForm((f) => ({ ...f, email: e.target.value }))}
                                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                                  />
                                  <input
                                    type="tel"
                                    placeholder="Phone"
                                    value={reserveForm.phone}
                                    onChange={(e) => setReserveForm((f) => ({ ...f, phone: e.target.value }))}
                                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Note (optional)"
                                    value={reserveForm.note}
                                    onChange={(e) => setReserveForm((f) => ({ ...f, note: e.target.value }))}
                                    className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={submitReservation}
                                      disabled={reserveSubmitting}
                                      className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-50"
                                    >
                                      {reserveSubmitting ? "Sending…" : "Send request"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setReserveUnitId(null); setReserveForm({ fullName: "", email: "", phone: "", note: "" }); }}
                                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setReserveUnitId(u.id)}
                                  className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-teal-400"
                                >
                                  Reserve Unit
                                </button>
                              )
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 4. AI INVESTMENT CARD */}
            <section className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-transparent p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-white">AI Investment Insight</h2>
              {analysisLoading ? (
                <p className="mt-4 text-slate-400">Analyzing project…</p>
              ) : analysis ? (
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Score</span>
                      <span className="font-semibold text-teal-400">{analysis.score}/100</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-teal-500 transition-all duration-500"
                        style={{ width: `${analysis.score}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white/5 p-4">
                      <p className="text-xs text-slate-500">Expected appreciation</p>
                      <p className="mt-1 font-semibold text-teal-400">+{(analysis.expectedAppreciation * 100).toFixed(0)}%</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-4">
                      <p className="text-xs text-slate-500">Rental yield</p>
                      <p className="mt-1 font-semibold text-teal-400">{(analysis.rentalYield * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <p className="font-medium text-white">Recommendation: {analysis.recommendation}</p>
                  {analysis.bestUnit && (
                    <p className="text-sm text-slate-300">
                      Best unit suggestion: <span className="font-medium text-teal-400">{analysis.bestUnit.type}</span> at ${analysis.bestUnit.price.toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-slate-400">Analysis unavailable. Score: 50 · Moderate.</p>
              )}
              {matchInfo && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">This project matches your profile</p>
                  <p className="mt-1 text-sm text-slate-300">Match score: {matchInfo.matchScore}/100</p>
                  <p className="mt-2 text-xs text-slate-400">{matchInfo.reasons.join(" · ")}</p>
                </div>
              )}
            </section>

            {/* 4b. INVESTOR UNIT PREDICTIONS */}
            {project.units?.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl">
                <h2 className="text-xl font-semibold text-white">Investor Unit Forecasts</h2>
                <div className="mt-6 grid gap-4">
                  {project.units.map((u) => {
                    const pred = predictUnitPrice(project, u);
                    return (
                      <div key={u.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{u.type}</p>
                            <p className="text-sm text-slate-400">Status: {u.status}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-slate-400">AI predicted value</p>
                            <p className="font-semibold text-teal-400">${pred.predictedDeliveryValue.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
                          <div className="rounded-lg bg-black/20 p-3"><p className="text-slate-500">Current</p><p className="mt-1 text-white">${pred.predictedCurrentValue.toLocaleString()}</p></div>
                          <div className="rounded-lg bg-black/20 p-3"><p className="text-slate-500">1 year</p><p className="mt-1 text-white">${pred.predicted1YearValue.toLocaleString()}</p></div>
                          <div className="rounded-lg bg-black/20 p-3"><p className="text-slate-500">Growth</p><p className="mt-1 text-white">{pred.predictedGrowthPercent.toFixed(1)}%</p></div>
                          <div className="rounded-lg bg-black/20 p-3"><p className="text-slate-500">Yield</p><p className="mt-1 text-white">{(pred.estimatedRentalYield * 100).toFixed(1)}%</p></div>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">Confidence {pred.confidence}%</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* 5. LEAD FORM */}
          <div className="lg:col-span-1">
            <div
              id="lead-form"
              className="sticky top-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl"
            >
              <h2 className="text-xl font-semibold text-white">Request Info</h2>
              <p className="mt-2 text-sm text-slate-400">Submit your details and we’ll get back to you.</p>
              <div className="mt-6 space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                />
                <textarea
                  placeholder="Message"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                />
                <button
                  type="button"
                  onClick={submitLead}
                  disabled={submitting}
                  className="w-full rounded-xl bg-teal-500 px-4 py-3.5 text-sm font-semibold text-slate-950 transition-all duration-200 hover:bg-teal-400 disabled:opacity-50 active:scale-[0.98]"
                >
                  {submitting ? "Sending…" : "Send request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert modal */}
      {alertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setAlertOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0e17] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white">Créer une alerte</h3>
            <p className="mt-1 text-sm text-slate-400">Get notified about this project (price changes, status, etc.).</p>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="City (optional)"
                value={alertForm.city}
                onChange={(e) => setAlertForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min price"
                  value={alertForm.minPrice}
                  onChange={(e) => setAlertForm((f) => ({ ...f, minPrice: e.target.value }))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
                />
                <input
                  type="number"
                  placeholder="Max price"
                  value={alertForm.maxPrice}
                  onChange={(e) => setAlertForm((f) => ({ ...f, maxPrice: e.target.value }))}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
                />
              </div>
              <input
                type="number"
                placeholder="Delivery year (optional)"
                value={alertForm.deliveryYear}
                onChange={(e) => setAlertForm((f) => ({ ...f, deliveryYear: e.target.value }))}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
              />
              <select
                value={alertForm.alertType}
                onChange={(e) => setAlertForm((f) => ({ ...f, alertType: e.target.value }))}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white"
              >
                <option value="new-project">New project updates</option>
                <option value="price-change">Price change</option>
                <option value="project-status">Project status</option>
                <option value="favorite-update">Favorite project updates</option>
              </select>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={submitAlert}
                disabled={alertSubmitting}
                className="flex-1 rounded-xl bg-teal-500 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                {alertSubmitting ? "Creating…" : "Create alert"}
              </button>
              <button
                type="button"
                onClick={() => setAlertOpen(false)}
                className="rounded-xl border border-white/20 px-4 py-2.5 text-sm text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
