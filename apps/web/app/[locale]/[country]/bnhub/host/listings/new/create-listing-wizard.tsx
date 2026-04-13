"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Autocomplete, GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { AiWriterToolbar } from "@/components/ai/AiWriterToolbar";
import { SpellCheckField } from "@/components/spell/SpellCheckField";
import { LegalReadinessPanel } from "@/components/legal/LegalReadinessPanel";
import { AiListingDraftPanel } from "@/components/bnhub/AiListingDraftPanel";
import { useSuppressFooterHistoryNav } from "@/components/layout/FooterHistoryNavContext";

const STEPS = [
  "Basics",
  "Location",
  "Details",
  "Photos",
  "Pricing",
  "Booking",
  "Review",
] as const;

const DEFAULT_MAP_CENTER = { lat: 45.5017, lng: -73.5673 };
const MAP_LIBRARIES: ("places")[] = ["places"];
const mapContainerStyle = { width: "100%", height: "100%" };
const listingMapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
};

type ListingFormData = {
  title: string;
  subtitle: string;
  description: string;
  propertyType: string;
  roomType: string;
  address: string;
  city: string;
  region: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  beds: string;
  baths: string;
  maxGuests: string;
  amenities: string;
  houseRules: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  photos: string;
  nightPriceCents: string;
  cleaningFeeCents: string;
  securityDepositCents: string;
  instantBookEnabled: boolean;
  minStayNights: string;
  maxStayNights: string;
  listingStatus: "DRAFT" | "PUBLISHED";
  conditionOfProperty: string;
  knownIssues: string;
};

type AddressFields = Pick<ListingFormData, "address" | "city" | "region" | "country">;

function getAddressComponent(
  place: google.maps.places.PlaceResult,
  type: string
): string {
  return (
    place.address_components?.find((component) => component.types.includes(type))
      ?.long_name ?? ""
  );
}

function extractAddressFields(place: google.maps.places.PlaceResult): AddressFields {
  const streetNumber = getAddressComponent(place, "street_number");
  const route = getAddressComponent(place, "route");
  const sublocality =
    getAddressComponent(place, "sublocality") ||
    getAddressComponent(place, "neighborhood");
  const city =
    getAddressComponent(place, "locality") ||
    getAddressComponent(place, "postal_town") ||
    getAddressComponent(place, "administrative_area_level_3") ||
    sublocality;
  const region =
    getAddressComponent(place, "administrative_area_level_1") ||
    getAddressComponent(place, "administrative_area_level_2");
  const country = getAddressComponent(place, "country");
  const address =
    [streetNumber, route].filter(Boolean).join(" ") ||
    place.name ||
    place.formatted_address ||
    "";

  return {
    address,
    city,
    region,
    country,
  };
}

function AddressMapPreview({
  address,
  city,
  region,
  country,
  hasKey,
  isLoaded,
  loadError,
  onAddressResolved,
}: {
  address: string;
  city: string;
  region: string;
  country: string;
  hasKey: boolean;
  isLoaded: boolean;
  loadError: Error | undefined;
  onAddressResolved: (fields: Partial<AddressFields>, coords?: { lat: number; lng: number }) => void;
}) {
  const [coords, setCoords] = useState(DEFAULT_MAP_CENTER);
  const [mapError, setMapError] = useState("");
  const [dragging, setDragging] = useState(false);

  const query = useMemo(
    () => [address, city, region, country].map((part) => part.trim()).filter(Boolean).join(", "),
    [address, city, region, country]
  );
  useEffect(() => {
    if (!isLoaded || !query || typeof google === "undefined") return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const location = results[0].geometry.location;
        setCoords({ lat: location.lat(), lng: location.lng() });
        setMapError("");
        return;
      }
      if (status === "ZERO_RESULTS") {
        setMapError("We could not place this address on the map yet.");
        return;
      }
      setMapError("Map preview is unavailable right now.");
    });
  }, [isLoaded, query]);

  if (!hasKey) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center text-sm text-slate-500">
        Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to show the address map preview.
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center text-sm text-slate-500">
        Enter the address details to preview the location on Google Maps.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center text-sm text-amber-200">
        Google Maps failed to load. Check the API key and try again.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/40 p-6 text-center text-sm text-slate-400">
        Loading map…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/40">
      <div className="h-[260px] w-full">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={coords}
          zoom={15}
          options={listingMapOptions}
        >
          <Marker
            position={coords}
            draggable
            onDragStart={() => {
              setDragging(true);
              setMapError("");
            }}
            onDragEnd={(event) => {
              setDragging(false);
              const lat = event.latLng?.lat();
              const lng = event.latLng?.lng();
              if (lat == null || lng == null || typeof google === "undefined") {
                setMapError("Could not read the new marker position.");
                return;
              }

              const nextCoords = { lat, lng };
              setCoords(nextCoords);

              const geocoder = new google.maps.Geocoder();
              geocoder.geocode({ location: nextCoords }, (results, status) => {
                if (status === "OK" && results?.[0]) {
                  const parsed = extractAddressFields(results[0]);
                  onAddressResolved(parsed, nextCoords);
                  setMapError("");
                  return;
                }
                if (status === "ZERO_RESULTS") {
                  setMapError("We could not match this map position to a nearby address.");
                  return;
                }
                setMapError("Could not update the address from the marker position.");
              });
            }}
          />
        </GoogleMap>
      </div>
      <div className="border-t border-slate-800 px-4 py-3">
        <p className="text-xs text-slate-400">{query}</p>
        <p className="mt-1 text-xs text-slate-500">
          Drag the marker to fine-tune the location and update the address fields.
        </p>
        {dragging ? <p className="mt-1 text-xs text-emerald-300">Updating address from marker…</p> : null}
        {mapError ? <p className="mt-1 text-xs text-amber-300">{mapError}</p> : null}
      </div>
    </div>
  );
}

export function CreateListingWizard() {
  useSuppressFooterHistoryNav(true);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const hasGoogleMapsKey = apiKey.length > 0;
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded: mapsLoaded, loadError: mapsLoadError } = useJsApiLoader({
    id: "bnhub-create-listing-map",
    googleMapsApiKey: hasGoogleMapsKey ? apiKey : "",
    libraries: MAP_LIBRARIES,
  });
  const [data, setData] = useState<ListingFormData>({
    title: "",
    subtitle: "",
    description: "",
    propertyType: "House",
    roomType: "Entire place",
    address: "",
    city: "",
    region: "",
    country: "US",
    latitude: null,
    longitude: null,
    beds: "1",
    baths: "1",
    maxGuests: "2",
    amenities: "" as string,
    houseRules: "",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    cancellationPolicy: "moderate",
    photos: "" as string,
    nightPriceCents: "",
    cleaningFeeCents: "0",
    securityDepositCents: "0",
    instantBookEnabled: false,
    minStayNights: "",
    maxStayNights: "",
    listingStatus: "DRAFT" as "DRAFT" | "PUBLISHED",
    conditionOfProperty: "",
    knownIssues: "",
  });

  const update = (k: keyof ListingFormData, v: string | number | boolean) => {
    setData((d) => ({ ...d, [k]: v }));
    setError("");
  };

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace();
    if (!place) return;
    const parsed = extractAddressFields(place);
    const lat = place.geometry?.location?.lat();
    const lng = place.geometry?.location?.lng();

    setData((current) => ({
      ...current,
      address: parsed.address || current.address,
      city: parsed.city || current.city,
      region: parsed.region || current.region,
      country: parsed.country || current.country,
      latitude: typeof lat === "number" ? lat : current.latitude,
      longitude: typeof lng === "number" ? lng : current.longitude,
    }));
    setError("");
  }

  async function handleSubmit() {
    setError("");
    const photoUrls = data.photos.split(",").map((u) => u.trim()).filter(Boolean);
    const desc = data.description.trim();
    if (desc.length < 20) {
      setError("Description must be at least 20 characters.");
      return;
    }
    if (photoUrls.length < 1) {
      setError("Add at least one photo URL in the Photos step (comma-separated).");
      return;
    }
    if (!data.title.trim() || !data.address.trim() || !data.city.trim()) {
      setError("Title, address, and city are required.");
      return;
    }
    const price = Number(data.nightPriceCents);
    if (!Number.isFinite(price) || price < 100) {
      setError("Nightly price must be at least $1.00 (100 cents).");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: data.title.trim(),
        subtitle: data.subtitle.trim() || undefined,
        description: desc,
        propertyType: data.propertyType,
        roomType: data.roomType,
        address: data.address.trim(),
        city: data.city.trim(),
        region: data.region.trim() || undefined,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        nightPriceCents: price,
        beds: parseInt(data.beds, 10) || 1,
        baths: parseFloat(data.baths) || 1,
        maxGuests: parseInt(data.maxGuests, 10) || 2,
        photos: photoUrls,
        amenities: data.amenities.split(",").map((a) => a.trim()).filter(Boolean),
        houseRules: data.houseRules.trim() || undefined,
        checkInTime: data.checkInTime || undefined,
        checkOutTime: data.checkOutTime || undefined,
        cancellationPolicy: data.cancellationPolicy,
        cleaningFeeCents: Number(data.cleaningFeeCents) || 0,
        securityDepositCents: Number(data.securityDepositCents) || 0,
        instantBookEnabled: data.instantBookEnabled,
        minStayNights: data.minStayNights ? parseInt(data.minStayNights, 10) : undefined,
        maxStayNights: data.maxStayNights ? parseInt(data.maxStayNights, 10) : undefined,
        listingStatus: data.listingStatus,
      };
      const res = await fetch("/api/bnhub/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error ?? "Failed to create listing");
      router.push("/bnhub/host/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create listing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(i)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
              i === step
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Property basics</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Property type</label>
                <select
                  value={data.propertyType}
                  onChange={(e) => update("propertyType", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                >
                  <option>House</option>
                  <option>Apartment</option>
                  <option>Villa</option>
                  <option>Cabin</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Room type</label>
                <select
                  value={data.roomType}
                  onChange={(e) => update("roomType", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                >
                  <option>Entire place</option>
                  <option>Private room</option>
                  <option>Shared room</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Beds</label>
                <input
                  type="number"
                  min={1}
                  value={data.beds}
                  onChange={(e) => update("beds", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Bathrooms</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={data.baths}
                  onChange={(e) => update("baths", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-slate-400">Max guests</label>
                <input
                  type="number"
                  min={1}
                  value={data.maxGuests}
                  onChange={(e) => update("maxGuests", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Location</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Address</label>
                {hasGoogleMapsKey && mapsLoaded ? (
                  <Autocomplete
                    onLoad={(instance) => {
                      autocompleteRef.current = instance;
                    }}
                    onUnmount={() => {
                      autocompleteRef.current = null;
                    }}
                    onPlaceChanged={handlePlaceChanged}
                    options={{
                      fields: ["address_components", "formatted_address", "geometry", "name"],
                      types: ["address"],
                    }}
                  >
                    <input
                      type="text"
                      value={data.address}
                      onChange={(e) => update("address", e.target.value)}
                      placeholder="Start typing and choose an address"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                    />
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    value={data.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="Street address"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  />
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Select a suggested address to auto-fill the city, region, and map.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">City</label>
                  <input
                    type="text"
                    value={data.city}
                    onChange={(e) => update("city", e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Region / State</label>
                  <input
                    type="text"
                    value={data.region}
                    onChange={(e) => update("region", e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Country</label>
                <input
                  type="text"
                  value={data.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs text-slate-400">Google Maps preview</label>
                <AddressMapPreview
                  address={data.address}
                  city={data.city}
                  region={data.region}
                  country={data.country}
                  hasKey={hasGoogleMapsKey}
                  isLoaded={mapsLoaded}
                  loadError={mapsLoadError}
                  onAddressResolved={(fields, coords) => {
                    setData((current) => ({
                      ...current,
                      address: fields.address || current.address,
                      city: fields.city || current.city,
                      region: fields.region || current.region,
                      country: fields.country || current.country,
                      latitude: coords?.lat ?? current.latitude,
                      longitude: coords?.lng ?? current.longitude,
                    }));
                  }}
                />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Details</h2>
            <div className="mt-4">
              <AiListingDraftPanel
                address={data.address}
                city={data.city}
                region={data.region}
                country={data.country}
                propertyType={data.propertyType}
                roomType={data.roomType}
                beds={data.beds}
                baths={data.baths}
                maxGuests={data.maxGuests}
                nightPriceCents={data.nightPriceCents}
                onApply={(patch) => {
                  setData((d) => ({ ...d, ...patch }));
                  setError("");
                }}
              />
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Title</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Cozy downtown apartment"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Subtitle (optional)</label>
                <SpellCheckField
                  value={data.subtitle}
                  onChange={(v) => update("subtitle", v)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  variant="slate"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Description</label>
                <AiWriterToolbar
                  className="mb-2"
                  type="listing"
                  value={data.description}
                  onChange={(v) => update("description", v)}
                  listingContext={{
                    propertyType: `${data.propertyType} · ${data.roomType}`,
                    location: [data.address, data.city, data.region, data.country].filter(Boolean).join(", "),
                    price: data.nightPriceCents
                      ? `$${(Number(data.nightPriceCents) / 100).toFixed(0)} / night (preview)`
                      : undefined,
                    features: [
                      `${data.beds} beds`,
                      `${data.baths} baths`,
                      `up to ${data.maxGuests} guests`,
                      data.amenities ? `Amenities: ${data.amenities}` : null,
                      data.title ? `Working title: ${data.title}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  }}
                />
                <SpellCheckField
                  multiline
                  value={data.description}
                  onChange={(v) => update("description", v)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  variant="slate"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={data.amenities}
                  onChange={(e) => update("amenities", e.target.value)}
                  placeholder="WiFi, Kitchen, Parking, TV"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">House rules</label>
                <textarea
                  value={data.houseRules}
                  onChange={(e) => update("houseRules", e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Condition of property (required to publish)</label>
                <SpellCheckField
                  value={data.conditionOfProperty}
                  onChange={(v) => update("conditionOfProperty", v)}
                  placeholder="e.g. Good, Excellent, Recently renovated"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  variant="slate"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Known issues (required to publish; use &quot;None&quot; if none)</label>
                <SpellCheckField
                  multiline
                  value={data.knownIssues}
                  onChange={(v) => update("knownIssues", v)}
                  rows={2}
                  placeholder="e.g. None, or describe any known issues"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  variant="slate"
                />
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Photos</h2>
            <p className="mt-1 text-xs text-slate-500">Enter image URLs, one per line or comma-separated.</p>
            <div className="mt-4">
              <textarea
                value={data.photos}
                onChange={(e) => update("photos", e.target.value)}
                rows={4}
                placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Pricing</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Nightly price (USD)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={data.nightPriceCents ? Number(data.nightPriceCents) / 100 : ""}
                  onChange={(e) => update("nightPriceCents", e.target.value ? String(Math.round(parseFloat(e.target.value) * 100)) : "")}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Cleaning fee (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                  value={data.cleaningFeeCents ? Number(data.cleaningFeeCents) / 100 : "0"}
                  onChange={(e) => update("cleaningFeeCents", e.target.value ? String(Math.round(parseFloat(e.target.value) * 100)) : "0")}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Security deposit (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                  value={data.securityDepositCents ? Number(data.securityDepositCents) / 100 : "0"}
                  onChange={(e) => update("securityDepositCents", e.target.value ? String(Math.round(parseFloat(e.target.value) * 100)) : "0")}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Guest pricing includes Québec GST (5%) and QST (9.975% on amount including GST) on rent + cleaning, calculated automatically at checkout.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Min stay (nights)</label>
                  <input
                    type="number"
                    min={0}
                    value={data.minStayNights}
                    onChange={(e) => update("minStayNights", e.target.value)}
                    placeholder="None"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Max stay (nights)</label>
                  <input
                    type="number"
                    min={0}
                    value={data.maxStayNights}
                    onChange={(e) => update("maxStayNights", e.target.value)}
                    placeholder="None"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Booking settings</h2>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                <label className="mb-1 block text-xs text-slate-400">Check-in time</label>
                <input
                  type="time"
                  value={data.checkInTime}
                  onChange={(e) => update("checkInTime", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
                  <p className="mt-1 text-xs text-slate-500">Use the built-in picker to choose the host check-in time.</p>
                </div>
                <div>
                <label className="mb-1 block text-xs text-slate-400">Check-out time</label>
                <input
                  type="time"
                  value={data.checkOutTime}
                  onChange={(e) => update("checkOutTime", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                />
                  <p className="mt-1 text-xs text-slate-500">Guests will see this as the expected departure time.</p>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Cancellation policy</label>
                <select
                  value={data.cancellationPolicy}
                  onChange={(e) => update("cancellationPolicy", e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
                >
                  <option value="flexible">Flexible</option>
                  <option value="moderate">Moderate</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.instantBookEnabled}
                  onChange={(e) => update("instantBookEnabled", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
                />
                <span className="text-sm text-slate-300">Instant book enabled</span>
              </label>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Review & submit</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-400">
              <p><span className="text-slate-500">Title:</span> {data.title || "—"}</p>
              <p><span className="text-slate-500">Location:</span> {data.address}, {data.city}, {data.country}</p>
              <p><span className="text-slate-500">Nightly:</span> ${data.nightPriceCents ? (Number(data.nightPriceCents) / 100).toFixed(0) : "—"}</p>
              <p><span className="text-slate-500">Instant book:</span> {data.instantBookEnabled ? "Yes" : "No"}</p>
            </div>
            <div className="mt-6">
              <label className="mb-2 block text-xs text-slate-400">Publish now or save as draft?</label>
              <select
                value={data.listingStatus}
                onChange={(e) => update("listingStatus", e.target.value as "DRAFT" | "PUBLISHED")}
                className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100"
              >
                <option value="DRAFT">Save as draft</option>
                <option value="PUBLISHED">Publish (will appear in search after verification if required)</option>
              </select>
            </div>
            <div className="mt-6">
              <LegalReadinessPanel
                listing={{
                  title: data.title,
                  description: data.description,
                  city: data.city,
                  imageCount: data.photos.split(",").map((u) => u.trim()).filter(Boolean).length,
                  contactEmail: "",
                }}
              />
            </div>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !data.title.trim() || !data.address.trim() || !data.city.trim() || !data.nightPriceCents}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create listing"}
          </button>
        )}
      </div>
    </div>
  );
}
