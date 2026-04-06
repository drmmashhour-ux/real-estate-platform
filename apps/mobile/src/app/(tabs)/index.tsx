import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import PropertyCard from "../../components/PropertyCard";
import PropertyCardSkeleton from "../../components/PropertyCardSkeleton";
import {
  SearchFiltersModal,
  type AppliedAdvancedFilters,
} from "../../components/search/SearchFiltersModal";
import { LocationSelectors } from "../../components/search/LocationSelectors";
import { LecipmLogo } from "../../components/branding/LecipmLogo";
import { useAppAuth } from "../../hooks/useAuth";
import { API_BASE_URL } from "../../config";
import { buildAuthHeaders } from "../../lib/authHeaders";
import { isSoftLaunchEnabled } from "../../lib/softLaunch";
import { useListings, type ListingFilters } from "../../lib/useListings";
import { colors } from "../../theme/colors";

/** Quick stay-type chips on the home card only (minimal). */
const QUICK_CHIPS: { label: string; token: string }[] = [
  { label: "Hotels", token: "hotel" },
  { label: "Apartments", token: "apartment" },
  { label: "Rooms", token: "room" },
];

const EMPTY_ADVANCED: AppliedAdvancedFilters = { amenities: [] };

function formatPricePerNight(n: number) {
  if (Number.isNaN(n)) return "—";
  const s = n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
  return `$${s} / night`;
}

function formatListingLocation(
  city: string | null | undefined,
  country: string | null | undefined
): string | null {
  const c = city?.trim();
  const co = country?.trim();
  if (c && co) return `${c}, ${co}`;
  if (c) return c;
  if (co) return co;
  return null;
}

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function buildApplied(
  advanced: AppliedAdvancedFilters,
  selectedChip: string | null,
  selectedCountry: string | null,
  selectedCity: string | null,
  optionalGuestsDraft: string
): ListingFilters {
  const propertyType = (selectedChip ?? advanced.propertyType)?.trim() || undefined;
  const country = selectedCountry?.trim() || undefined;
  const city = selectedCity?.trim() || undefined;
  const gRaw = optionalGuestsDraft.trim();
  const parsedG = gRaw ? parseInt(gRaw, 10) : NaN;
  const guestsFromDraft =
    Number.isFinite(parsedG) && parsedG > 0 ? Math.min(50, Math.floor(parsedG)) : undefined;
  const guests = guestsFromDraft ?? advanced.guests;
  return {
    country,
    city,
    minPrice: advanced.minPrice,
    maxPrice: advanced.maxPrice,
    guests,
    bedrooms: advanced.bedrooms,
    bathrooms: advanced.bathrooms,
    minRating: advanced.minRating,
    amenities: advanced.amenities.length > 0 ? advanced.amenities : undefined,
    propertyType,
  };
}

function filtersSummary(f: ListingFilters): string | null {
  const parts: string[] = [];
  const cty = f.city?.trim();
  const ctry = f.country?.trim();
  if (cty && ctry) parts.push(`${cty}, ${ctry}`);
  else {
    if (cty) parts.push(cty);
    if (ctry) parts.push(ctry);
  }
  if (f.propertyType) parts.push(f.propertyType.replace(/_/g, " "));
  if (f.minPrice != null || f.maxPrice != null) {
    parts.push(`$${f.minPrice ?? "…"}–${f.maxPrice ?? "…"}/night`);
  }
  if (f.guests != null) parts.push(`${f.guests}+ guests`);
  if (f.bedrooms != null) parts.push(`${f.bedrooms}+ bed`);
  if (f.bathrooms != null) parts.push(`${f.bathrooms}+ bath`);
  if (f.minRating != null) parts.push(`${f.minRating}+★`);
  if (f.amenities?.length) parts.push(`${f.amenities.length} amenities`);
  return parts.length ? parts.join(" · ") : null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { session, signOut, me, ready: authReady } = useAppAuth();
  const [hostAttentionCount, setHostAttentionCount] = useState(0);

  const showHostEntry = Boolean(session && me && (me.appRole === "host" || me.appRole === "admin"));

  useEffect(() => {
    if (!authReady || !session || !me || (me.appRole !== "host" && me.appRole !== "admin")) {
      setHostAttentionCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const url = `${API_BASE_URL.replace(/\/$/, "")}/api/mobile/v1/bnhub/host/bookings`;
        const headers = await buildAuthHeaders();
        const res = await fetch(url, { headers });
        const data = (await res.json().catch(() => ({}))) as { attentionCount?: number };
        if (!cancelled && res.ok && typeof data.attentionCount === "number") {
          setHostAttentionCount(data.attentionCount);
        }
      } catch {
        if (!cancelled) setHostAttentionCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, session, me?.appRole, me]);

  const [advanced, setAdvanced] = useState<AppliedAdvancedFilters>(EMPTY_ADVANCED);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [optionalGuestsDraft, setOptionalGuestsDraft] = useState("");
  const [optionalCheckIn, setOptionalCheckIn] = useState<string | null>(null);
  const [optionalCheckOut, setOptionalCheckOut] = useState<string | null>(null);
  const [dateModal, setDateModal] = useState<"in" | "out" | null>(null);

  const [applied, setApplied] = useState<ListingFilters>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [filtersModalKey, setFiltersModalKey] = useState(0);

  const { listings, total, loading, error } = useListings(applied);

  const modalInitial = useMemo(
    (): AppliedAdvancedFilters => ({
      ...advanced,
      propertyType: advanced.propertyType ?? selectedChip ?? undefined,
    }),
    [advanced, selectedChip]
  );

  const commitSearch = useCallback(() => {
    setApplied(buildApplied(advanced, selectedChip, selectedCountry, selectedCity, optionalGuestsDraft));
  }, [advanced, selectedChip, selectedCountry, selectedCity, optionalGuestsDraft]);

  const onChipPress = useCallback(
    (token: string) => {
      setSelectedChip((prev) => {
        const next = prev === token ? null : token;
        setApplied(buildApplied(advanced, next, selectedCountry, selectedCity, optionalGuestsDraft));
        return next;
      });
    },
    [advanced, selectedCountry, selectedCity, optionalGuestsDraft]
  );

  const onModalApply = useCallback(
    (next: AppliedAdvancedFilters) => {
      setAdvanced(next);
      setSelectedChip(null);
      setOptionalGuestsDraft(next.guests != null ? String(next.guests) : "");
      setApplied(buildApplied(next, null, selectedCountry, selectedCity, next.guests != null ? String(next.guests) : ""));
    },
    [selectedCountry, selectedCity]
  );

  const onModalReset = useCallback(() => {
    setAdvanced(EMPTY_ADVANCED);
    setSelectedChip(null);
    setApplied(buildApplied(EMPTY_ADVANCED, null, selectedCountry, selectedCity, optionalGuestsDraft));
  }, [selectedCountry, selectedCity, optionalGuestsDraft]);

  const onSelectCountry = useCallback(
    (country: string | null) => {
      setSelectedCountry(country);
      setSelectedCity(null);
      setApplied(buildApplied(advanced, selectedChip, country, null, optionalGuestsDraft));
    },
    [advanced, selectedChip, optionalGuestsDraft]
  );

  const onSelectCity = useCallback(
    (city: string | null) => {
      setSelectedCity(city);
      setApplied(buildApplied(advanced, selectedChip, selectedCountry, city, optionalGuestsDraft));
    },
    [advanced, selectedChip, selectedCountry, optionalGuestsDraft]
  );

  const resetLocation = useCallback(() => {
    setSelectedCountry(null);
    setSelectedCity(null);
    setApplied(buildApplied(advanced, selectedChip, null, null, optionalGuestsDraft));
  }, [advanced, selectedChip, optionalGuestsDraft]);

  const onCalendarDayPress = useCallback(
    (day: { dateString: string }) => {
      const ds = day.dateString;
      if (dateModal === "in") {
        setOptionalCheckIn(ds);
        if (optionalCheckOut && optionalCheckOut <= ds) setOptionalCheckOut(null);
        setDateModal(null);
        return;
      }
      if (dateModal === "out") {
        if (optionalCheckIn && ds <= optionalCheckIn) {
          setOptionalCheckIn(ds);
          setOptionalCheckOut(null);
        } else {
          setOptionalCheckOut(ds);
        }
        setDateModal(null);
      }
    },
    [dateModal, optionalCheckIn, optionalCheckOut]
  );

  const markedForModal = useMemo(() => {
    const m: Record<string, { selected?: boolean; selectedColor?: string; selectedTextColor?: string }> = {};
    if (optionalCheckIn) {
      m[optionalCheckIn] = {
        selected: true,
        selectedColor: colors.gold,
        selectedTextColor: "#0a0a0a",
      };
    }
    if (optionalCheckOut && optionalCheckOut !== optionalCheckIn) {
      m[optionalCheckOut] = {
        selected: true,
        selectedColor: colors.gold,
        selectedTextColor: "#0a0a0a",
      };
    }
    return m;
  }, [optionalCheckIn, optionalCheckOut]);

  const appliedListingSummary = useMemo(() => filtersSummary(applied), [applied]);

  const summary = useMemo(() => {
    const base = appliedListingSummary;
    const extra: string[] = [];
    if (optionalCheckIn) extra.push(`Check-in ${formatShortDate(optionalCheckIn)}`);
    if (optionalCheckOut) extra.push(`Check-out ${formatShortDate(optionalCheckOut)}`);
    const og = optionalGuestsDraft.trim();
    if (og && /^\d+$/.test(og)) extra.push(`${og} guests (planned)`);
    const x = extra.length ? extra.join(" · ") : null;
    if (!base && !x) return null;
    if (base && x) return `${base} · ${x}`;
    return base ?? x;
  }, [appliedListingSummary, optionalCheckIn, optionalCheckOut, optionalGuestsDraft]);

  const hasListingFilters = Boolean(appliedListingSummary);
  const hasSummaryLine = Boolean(summary);

  const showSkeletons = loading && listings.length === 0;
  const showEmptyNoResults = !loading && !error && listings.length === 0;
  const displayError = Boolean(error);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <SearchFiltersModal
        key={filtersModalKey}
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={modalInitial}
        onApply={onModalApply}
        onReset={onModalReset}
      />

      <Modal visible={dateModal != null} transparent animationType="fade" onRequestClose={() => setDateModal(null)}>
        <Pressable style={styles.dateBackdrop} onPress={() => setDateModal(null)}>
          <Pressable style={styles.dateSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.dateSheetTitle}>{dateModal === "in" ? "Check-in" : "Check-out"}</Text>
            <Text style={styles.dateSheetHint}>Optional — for your plans. Browse is not limited by dates yet.</Text>
            <Calendar
              onDayPress={onCalendarDayPress}
              markedDates={markedForModal}
              theme={{
                todayTextColor: colors.gold,
                arrowColor: colors.gold,
                selectedDayBackgroundColor: colors.gold,
                selectedDayTextColor: "#0a0a0a",
              }}
            />
            <Pressable onPress={() => setDateModal(null)} style={styles.dateCloseBtn}>
              <Text style={styles.dateCloseLabel}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandHero}>
          <LecipmLogo size={48} centered />
          <Text style={styles.bnhubStays}>BNHub Stays</Text>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.heroQuestion}>Where are you going?</Text>

          <LocationSelectors
            selectedCountry={selectedCountry}
            selectedCity={selectedCity}
            onSelectCountry={onSelectCountry}
            onSelectCity={onSelectCity}
          />

          {selectedCountry || selectedCity ? (
            <Pressable onPress={resetLocation} style={({ pressed }) => [styles.clearLocation, pressed && styles.chipPressed]}>
              <Text style={styles.clearLocationLabel}>Clear location</Text>
            </Pressable>
          ) : null}

          <Text style={styles.optionalSectionLabel}>Optional</Text>

          <View style={styles.dateRow}>
            <Pressable
              onPress={() => setDateModal("in")}
              style={({ pressed }) => [styles.optionalField, pressed && styles.chipPressed]}
            >
              <Text style={styles.optionalFieldLabel}>Check-in</Text>
              <Text style={styles.optionalFieldValue}>{optionalCheckIn ? formatShortDate(optionalCheckIn) : "Add"}</Text>
            </Pressable>
            <Pressable
              onPress={() => setDateModal("out")}
              style={({ pressed }) => [styles.optionalField, pressed && styles.chipPressed]}
            >
              <Text style={styles.optionalFieldLabel}>Check-out</Text>
              <Text style={styles.optionalFieldValue}>{optionalCheckOut ? formatShortDate(optionalCheckOut) : "Add"}</Text>
            </Pressable>
          </View>

          {(optionalCheckIn || optionalCheckOut) ? (
            <Pressable
              onPress={() => {
                setOptionalCheckIn(null);
                setOptionalCheckOut(null);
              }}
              style={({ pressed }) => [styles.clearDates, pressed && styles.chipPressed]}
            >
              <Text style={styles.clearDatesLabel}>Clear dates</Text>
            </Pressable>
          ) : null}

          <TextInput
            value={optionalGuestsDraft}
            onChangeText={setOptionalGuestsDraft}
            placeholder="Guests (optional)"
            placeholderTextColor={colors.muted}
            style={styles.guestsInput}
            keyboardType="number-pad"
            maxLength={2}
            accessibilityLabel="Number of guests, optional"
          />

          <Pressable onPress={() => void commitSearch()} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}>
            <Text style={styles.primaryBtnLabel}>Search stays</Text>
          </Pressable>

          <View style={styles.chipsRow}>
            {QUICK_CHIPS.map((c) => {
              const on = selectedChip === c.token;
              return (
                <Pressable
                  key={c.token}
                  onPress={() => onChipPress(c.token)}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    on && styles.categoryChipSelected,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <Text style={[styles.categoryChipLabel, on && styles.categoryChipLabelSelected]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => {
              setFiltersModalKey((k) => k + 1);
              setModalOpen(true);
            }}
            style={({ pressed }) => [styles.moreFiltersBtn, pressed && styles.chipPressed]}
          >
            <Text style={styles.moreFiltersLabel}>More filters</Text>
            {hasListingFilters ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>

        <View style={styles.belowSearchRow}>
          <Pressable onPress={() => router.push("/search")} style={({ pressed }) => [styles.chipOutline, pressed && styles.chipPressed]}>
            <Text style={styles.chipOutlineLabel}>AI search</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/map-search")} style={({ pressed }) => [styles.chipOutline, pressed && styles.chipPressed]}>
            <Text style={styles.chipOutlineLabel}>Map</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/my-bookings")} style={({ pressed }) => [styles.chipOutline, pressed && styles.chipPressed]}>
            <Text style={styles.chipOutlineLabel}>My bookings</Text>
          </Pressable>
          {showHostEntry ? (
            <Pressable
              onPress={() => router.push("/host/dashboard")}
              style={({ pressed }) => [styles.chipOutline, styles.hostChip, pressed && styles.chipPressed]}
            >
              <View style={styles.hostChipInner}>
                <Text style={styles.chipOutlineLabel}>Host hub</Text>
                {hostAttentionCount > 0 ? (
                  <View style={styles.hostNotifDot}>
                    <Text style={styles.hostNotifCount}>{hostAttentionCount > 9 ? "9+" : String(hostAttentionCount)}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          ) : null}
          {!session ? (
            <Pressable onPress={() => router.push("/(auth)/sign-in")} style={({ pressed }) => [styles.chipOutline, pressed && styles.chipPressed]}>
              <Text style={styles.chipOutlineLabel}>Sign in</Text>
            </Pressable>
          ) : null}
          {!session ? (
            <Pressable onPress={() => router.push("/(auth)/sign-up")} style={({ pressed }) => [styles.chipOutline, pressed && styles.chipPressed]}>
              <Text style={styles.chipOutlineLabel}>Create account</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => void signOut()} style={({ pressed }) => [styles.chipOutline, pressed && styles.chipPressed]}>
              <Text style={styles.chipOutlineLabel}>Sign out</Text>
            </Pressable>
          )}
          {__DEV__ ? (
            <Pressable onPress={() => router.push("/admin-metrics")} style={({ pressed }) => [styles.chipOutline, pressed && styles.chipPressed]}>
              <Text style={styles.chipOutlineLabel}>Admin metrics</Text>
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.inlineLoad}>
            <ActivityIndicator size="small" color={colors.gold} />
            <Text style={styles.inlineLoadText}>Updating…</Text>
          </View>
        ) : null}

        {!loading && !error ? (
          <Text style={styles.resultsCount}>
            {total} {total === 1 ? "stay" : "stays"}
            {hasListingFilters ? " match your filters" : ""}
          </Text>
        ) : null}

        {hasSummaryLine && summary ? <Text style={styles.filterSummary}>{summary}</Text> : null}

        {displayError ? <Text style={styles.err}>Unable to load stays. Please try again.</Text> : null}

        {showEmptyNoResults ? (
          <Text style={styles.emptyState}>No stays found — try another location.</Text>
        ) : null}

        {isSoftLaunchEnabled() ? (
          <View style={styles.growthRow}>
            <Pressable onPress={() => router.push("/feedback")} style={({ pressed }) => [styles.growthChip, pressed && styles.chipPressed]}>
              <Text style={styles.growthChipLabel}>Send feedback</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/become-host")} style={({ pressed }) => [styles.growthChipOutline, pressed && styles.chipPressed]}>
              <Text style={styles.growthChipOutlineLabel}>Become a host</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.listSpacer} />

        {showSkeletons
          ? [0, 1, 2, 3].map((k) => <PropertyCardSkeleton key={`sk-${k}`} />)
          : null}

        {listings.map((item) => {
          const sr = item.star_rating;
          const apiAvg =
            typeof item.ratingAverage === "number" && Number.isFinite(item.ratingAverage) && item.ratingAverage > 0
              ? item.ratingAverage
              : null;
          const cardStar = apiAvg ?? (typeof sr === "number" && sr > 0 ? sr : null);
          const cardReviews =
            typeof item.reviewCount === "number" && item.reviewCount > 0 ? item.reviewCount : null;
          const showTopChoice = item.topHost === true || (typeof sr === "number" && Number.isFinite(sr) && sr >= 4.5);
          const trustTags: string[] = [];
          if (item.hostVerified) trustTags.push("Verified host");
          if (item.topHost) trustTags.push("Top host");
          return (
            <PropertyCard
              key={item.id}
              listingId={item.id}
              title={item.title}
              locationLine={formatListingLocation(item.city, item.country)}
              featureLabels={item.amenities_preview}
              coverUrl={item.cover_image_url}
              priceLabel={formatPricePerNight(item.price_per_night)}
              starRating={cardStar}
              reviewCount={cardReviews}
              trustTags={trustTags.length ? trustTags : undefined}
              showTopChoice={showTopChoice}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/property",
                  params: { id: item.id },
                })
              }
            />
          );
        })}

        <Pressable onPress={() => router.push("/host-earnings")} style={styles.hostLink}>
          <Text style={styles.hostLinkLabel}>Host earnings</Text>
        </Pressable>

        {__DEV__ ? (
          <Pressable onPress={() => router.push("/dev-debug")} style={styles.devLink}>
            <Text style={styles.devLinkLabel}>Dev debug</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 22, paddingBottom: 40 },
  brandHero: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 8,
  },
  bnhubStays: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    letterSpacing: 0.5,
  },
  searchCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    marginBottom: 28,
  },
  heroQuestion: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    marginBottom: 22,
  },
  clearLocation: { alignSelf: "flex-start", marginBottom: 20, marginTop: -6 },
  clearLocationLabel: { color: colors.gold, fontWeight: "800", fontSize: 14 },
  optionalSectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  dateRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  optionalField: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  optionalFieldLabel: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 4 },
  optionalFieldValue: { color: colors.text, fontSize: 16, fontWeight: "700" },
  clearDates: { alignSelf: "flex-start", marginBottom: 14 },
  clearDatesLabel: { color: colors.gold, fontWeight: "700", fontSize: 13 },
  guestsInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: 28,
  },
  primaryBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnLabel: { color: "#0a0a0a", fontWeight: "900", fontSize: 17 },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22,
    marginBottom: 6,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.goldDim,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.surface2,
  },
  categoryChipSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  categoryChipLabel: { color: colors.gold, fontWeight: "700", fontSize: 14 },
  categoryChipLabelSelected: { color: "#0a0a0a" },
  moreFiltersBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 2,
    marginTop: 8,
  },
  moreFiltersLabel: { color: colors.text, fontWeight: "700", fontSize: 15 },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  belowSearchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 22 },
  chipOutline: {
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  chipPressed: { opacity: 0.9 },
  chipOutlineLabel: { color: colors.gold, fontWeight: "700", fontSize: 13 },
  hostChip: { borderColor: colors.goldDim },
  hostChipInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  hostNotifDot: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  hostNotifCount: { color: "#fff", fontSize: 11, fontWeight: "900" },
  resultsCount: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 6,
  },
  filterSummary: {
    color: colors.goldDim,
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  err: { color: colors.danger, marginBottom: 16, textAlign: "center", fontSize: 14 },
  emptyState: { color: colors.muted, marginBottom: 18, textAlign: "center", fontSize: 15, lineHeight: 22 },
  growthRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  growthChip: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  growthChipLabel: { color: colors.text, fontWeight: "700", fontSize: 13 },
  growthChipOutline: {
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  growthChipOutlineLabel: { color: colors.gold, fontWeight: "700", fontSize: 13 },
  hostLink: { marginTop: 24, paddingVertical: 12, alignItems: "center" },
  hostLinkLabel: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  devLink: { marginTop: 8, paddingVertical: 8, alignItems: "center" },
  devLinkLabel: { color: colors.muted, fontSize: 11, fontWeight: "600", opacity: 0.7 },
  inlineLoad: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  inlineLoadText: { color: colors.muted, fontSize: 13 },
  listSpacer: { height: 8 },
  dateBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  dateSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingBottom: 20,
    maxHeight: "78%",
  },
  dateSheetTitle: {
    color: colors.gold,
    fontWeight: "800",
    fontSize: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  dateSheetHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  dateCloseBtn: { alignItems: "center", paddingVertical: 14 },
  dateCloseLabel: { color: colors.gold, fontWeight: "800", fontSize: 16 },
});
