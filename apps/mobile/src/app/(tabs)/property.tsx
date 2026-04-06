import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { API_BASE_URL } from "../../config";
import { AUTH_DISABLED } from "../../config/dev";
import { ListingGallery } from "../../components/ListingGallery";
import { isFavoriteListing, toggleFavoriteListing } from "../../lib/favorites";
import { nightsBetween } from "../../lib/bookingDates";
import { encodeBookingResume } from "../../lib/bookingResume";
import { trackBnhubEvent } from "../../lib/bnhubTrack";
import { PropertyReviewsSection } from "../../components/PropertyReviewsSection";
import type { ListingReviewRow } from "../../types/review";
import { colors } from "../../theme/colors";
import { InsuranceLeadForm } from "../../components/InsuranceLeadForm";
import { TrustHostStrip } from "../../components/TrustHostStrip";
import { VerifiedUserBadge } from "../../components/VerifiedUserBadge";
import { useAppAuth } from "../../hooks/useAuth";

const DESC_PREVIEW_CHARS = 240;

type DetailResponse = {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  country?: string | null;
  star_rating?: number | null;
  price_per_night: number;
  cover_image_url: string | null;
  galleryUrls: string[];
  reviewSummary: { average: number | null; count: number };
  reviewPreview: ListingReviewRow[];
  amenitiesList?: string[];
  max_guests?: number | null;
  house_rules?: string | null;
  check_in_instructions?: string | null;
  /** From Prisma when listing id matches `bnhub_listings`. */
  require_guest_identity_verification?: boolean;
  trust?: {
    hostRating: number | null;
    reviewCount: number;
    completedBookings: number;
    hostVerified: boolean;
    topHost: boolean;
  } | null;
};

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function locationLine(city: string | null, country: string | null | undefined): string {
  const c = city?.trim();
  const co = country?.trim();
  if (c && co) return `${c}, ${co}`;
  if (c) return c;
  if (co) return co;
  return "Location details after booking";
}

export default function PropertyScreen() {
  const { id: idParam, rankTags: rankTagsParam } = useLocalSearchParams<{
    id: string | string[];
    rankTags?: string | string[];
  }>();
  const id = useMemo(() => (Array.isArray(idParam) ? idParam[0] : idParam) ?? "", [idParam]);
  const rankTags = useMemo(() => {
    const r = Array.isArray(rankTagsParam) ? rankTagsParam[0] : rankTagsParam;
    if (!r || typeof r !== "string") return [] as string[];
    return r.split("|").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  }, [rankTagsParam]);
  const router = useRouter();
  const { session, me } = useAppAuth();
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fav, setFav] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [guestsDraft, setGuestsDraft] = useState("2");
  const [dateModal, setDateModal] = useState<"in" | "out" | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchProperty() {
      if (!id) {
        setFetchError("Missing listing id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError(null);
      try {
        const url = `${API_BASE_URL.replace(/\/$/, "")}/api/bnhub/public/listings/${encodeURIComponent(id)}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = (await res.json().catch(() => ({}))) as DetailResponse & { error?: string };
        if (!active) return;
        if (!res.ok) {
          setFetchError(typeof data.error === "string" ? data.error : "We could not load this property.");
          setDetail(null);
          setLoading(false);
          return;
        }
        setDetail(data);
        setFetchError(null);
        void trackBnhubEvent("view_property", { listingId: id });
        void isFavoriteListing(id).then(setFav);
      } catch {
        if (!active) return;
        setFetchError("Network error — check EXPO_PUBLIC_API_BASE_URL.");
        setDetail(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchProperty();

    return () => {
      active = false;
    };
  }, [id]);

  const galleryCombined = useMemo(() => {
    if (!detail) return [];
    const c = detail.cover_image_url?.trim();
    const rest = detail.galleryUrls.map((u) => String(u).trim()).filter(Boolean);
    const ordered = c ? [c, ...rest.filter((u) => u !== c)] : rest;
    return ordered;
  }, [detail]);

  const nights = useMemo(
    () => (checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0),
    [checkIn, checkOut]
  );

  const nightlyPrice = detail?.price_per_night ?? 0;
  const totalStay =
    nights > 0 && Number.isFinite(nightlyPrice) ? Math.round(nights * nightlyPrice * 100) / 100 : 0;

  const markedForModal = useMemo(() => {
    const m: Record<string, { selected?: boolean; selectedColor?: string; selectedTextColor?: string }> = {};
    if (checkIn) {
      m[checkIn] = {
        selected: true,
        selectedColor: colors.gold,
        selectedTextColor: "#0a0a0a",
      };
    }
    if (checkOut && checkOut !== checkIn) {
      m[checkOut] = {
        selected: true,
        selectedColor: colors.gold,
        selectedTextColor: "#0a0a0a",
      };
    }
    return m;
  }, [checkIn, checkOut]);

  const onCalendarDayPress = useCallback(
    (day: { dateString: string }) => {
      const ds = day.dateString;
      if (dateModal === "in") {
        setCheckIn(ds);
        if (checkOut && checkOut <= ds) setCheckOut(null);
        setDateModal(null);
        return;
      }
      if (dateModal === "out") {
        if (checkIn && ds <= checkIn) {
          setCheckIn(ds);
          setCheckOut(null);
        } else {
          setCheckOut(ds);
        }
        setDateModal(null);
      }
    },
    [dateModal, checkIn, checkOut]
  );

  const parsedGuests = useMemo(() => {
    const n = parseInt(guestsDraft.trim(), 10);
    return Number.isFinite(n) && n > 0 ? Math.min(50, n) : null;
  }, [guestsDraft]);

  const maxGuestsCap = detail?.max_guests != null && detail.max_guests > 0 ? detail.max_guests : null;

  const goBook = useCallback(() => {
    if (!detail) return;
    if (!checkIn || !checkOut) {
      Alert.alert("Select dates", "Choose check-in and check-out to see your stay total and continue.");
      return;
    }
    if (nights <= 0) {
      Alert.alert("Select dates", "Check-out must be after check-in.");
      return;
    }
    if (parsedGuests == null) {
      Alert.alert("Guests", "Enter the number of guests (at least 1).");
      return;
    }
    if (maxGuestsCap != null && parsedGuests > maxGuestsCap) {
      Alert.alert("Guests", `This stay hosts up to ${maxGuestsCap} guests.`);
      return;
    }
    const summaryParams = {
      listingId: detail.id,
      price: String(detail.price_per_night),
      title: detail.title,
      checkIn,
      checkOut,
      guests: String(parsedGuests),
      coverUrl: detail.cover_image_url?.trim() ?? "",
    };

    if (!AUTH_DISABLED && !session) {
      const returnBooking = encodeBookingResume({
        listingId: summaryParams.listingId,
        price: summaryParams.price,
        title: summaryParams.title,
        checkIn: summaryParams.checkIn,
        checkOut: summaryParams.checkOut,
        guests: summaryParams.guests,
        coverUrl: summaryParams.coverUrl || undefined,
      });
      router.push({
        pathname: "/(auth)/sign-in",
        params: { returnBooking },
      });
      return;
    }

    router.push({
      pathname: "/booking-summary",
      params: summaryParams,
    });
  }, [detail, checkIn, checkOut, nights, parsedGuests, maxGuestsCap, router, session]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingHint}>Loading property…</Text>
      </View>
    );
  }

  if (fetchError || !detail) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.padded}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Unavailable</Text>
            <Text style={styles.notFound}>{fetchError ?? "Property not found."}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const property = detail;
  const reviewAvg = property.reviewSummary.average;
  const reviewCount = property.reviewSummary.count;
  const listingStar = typeof property.star_rating === "number" && property.star_rating > 0 ? property.star_rating : null;
  const displayRating = reviewAvg ?? listingStar;
  const showRating = displayRating != null && displayRating > 0;
  const amenities = Array.isArray(property.amenitiesList) ? property.amenitiesList : [];

  const rawDesc = (property.description || "").trim();
  const descLong = rawDesc.length > DESC_PREVIEW_CHARS;
  const descShown =
    descExpanded || !descLong ? rawDesc : `${rawDesc.slice(0, DESC_PREVIEW_CHARS).trim()}…`;

  const trustDefaults = {
    instructions:
      "You'll receive the full address, host contact, and any arrival notes in your confirmation email after booking.",
    entry:
      "Door codes, lockbox details, or meet-and-greet instructions are shared once your reservation is confirmed.",
    rules: "No parties or events · Treat the home with care · Respect quiet hours and neighbors",
  };

  const keyInstructions = property.check_in_instructions?.trim() || trustDefaults.instructions;
  const entryInfo = trustDefaults.entry;
  const houseRulesBlock = property.house_rules?.trim() || trustDefaults.rules;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <Modal visible={dateModal != null} transparent animationType="fade" onRequestClose={() => setDateModal(null)}>
        <Pressable style={styles.dateBackdrop} onPress={() => setDateModal(null)}>
          <Pressable style={styles.dateSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.dateSheetTitle}>{dateModal === "in" ? "Check-in" : "Check-out"}</Text>
            <Text style={styles.dateSheetHint}>Checkout day is not charged as a night.</Text>
            <Calendar
              onDayPress={onCalendarDayPress}
              markedDates={markedForModal}
              theme={{
                todayTextColor: colors.gold,
                arrowColor: colors.gold,
                selectedDayBackgroundColor: colors.gold,
                selectedDayTextColor: "#0a0a0a",
                calendarBackground: colors.card,
                backgroundColor: colors.card,
                monthTextColor: colors.text,
                dayTextColor: colors.text,
                textDisabledColor: colors.muted,
                textSectionTitleColor: colors.muted,
              }}
            />
            <Pressable onPress={() => setDateModal(null)} style={styles.dateCloseBtn}>
              <Text style={styles.dateCloseLabel}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        </View>

        <ListingGallery
          title={property.title}
          imageUrls={galleryCombined}
          onOpenMap={() => router.push("/map-search")}
          fullBleed
          fixedHeight={260}
        />

        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{property.title}</Text>
            <Pressable
              onPress={() => {
                void (async () => {
                  const next = await toggleFavoriteListing(property.id);
                  setFav(next);
                })();
              }}
              style={styles.favBtn}
              accessibilityLabel={fav ? "Remove from saved" : "Save listing"}
            >
              <Text style={styles.favIcon}>{fav ? "♥" : "♡"}</Text>
            </Pressable>
          </View>

          <Text style={styles.location}>{locationLine(property.city, property.country)}</Text>

          {rankTags.length > 0 ? (
            <View style={styles.matchRow}>
              {rankTags.map((t, i) => (
                <View key={`${i}-${t}`} style={styles.matchTag}>
                  <Text style={styles.matchTagText}>{t}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {property.trust ? (
            <TrustHostStrip
              hostRating={property.trust.hostRating ?? displayRating}
              reviewCount={property.trust.reviewCount}
              completedBookings={property.trust.completedBookings}
              hostVerified={property.trust.hostVerified}
              topHost={property.trust.topHost}
            />
          ) : null}

          {showRating ? (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingValue}>{displayRating!.toFixed(1)}</Text>
              {reviewCount > 0 ? (
                <Text style={styles.ratingCount}>
                  ({reviewCount} guest review{reviewCount === 1 ? "" : "s"})
                </Text>
              ) : listingStar != null && reviewCount === 0 ? (
                <Text style={styles.ratingCount}>(host-listed rating)</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.bookingCard}>
            <View style={styles.bookingTitleRow}>
              <Text style={styles.bookingTitle}>Book your stay</Text>
              {me?.identityVerification?.isVerified ? <VerifiedUserBadge compact /> : null}
            </View>
            <Text style={styles.bookingSub}>Select dates and guests — total updates instantly.</Text>
            {property.require_guest_identity_verification ? (
              <View style={styles.hostIdBanner}>
                <Text style={styles.hostIdBannerText}>
                  This host asks for a verified government ID before you can book.
                </Text>
              </View>
            ) : null}

            <View style={styles.dateRow}>
              <Pressable
                onPress={() => setDateModal("in")}
                style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
              >
                <Text style={styles.dateLabel}>Check-in</Text>
                <Text style={styles.dateValue}>{checkIn ? formatShortDate(checkIn) : "Add date"}</Text>
              </Pressable>
              <Pressable
                onPress={() => setDateModal("out")}
                style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
              >
                <Text style={styles.dateLabel}>Check-out</Text>
                <Text style={styles.dateValue}>{checkOut ? formatShortDate(checkOut) : "Add date"}</Text>
              </Pressable>
            </View>

            <Text style={styles.guestsLabel}>Guests</Text>
            <TextInput
              value={guestsDraft}
              onChangeText={setGuestsDraft}
              placeholder="2"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={2}
              style={styles.guestsInput}
              accessibilityLabel="Number of guests"
            />
            {maxGuestsCap != null ? (
              <Text style={styles.guestsCap}>Up to {maxGuestsCap} guests for this listing.</Text>
            ) : null}

            <View style={styles.totalBlock}>
              <Text style={styles.totalLabel}>Total for stay</Text>
              <Text style={styles.totalValue}>
                {nights > 0
                  ? `$${Number.isInteger(totalStay) ? totalStay.toFixed(0) : totalStay.toFixed(2)}`
                  : "—"}
              </Text>
              <Text style={styles.totalMeta}>
                {nights > 0
                  ? `${nights} night${nights === 1 ? "" : "s"} × $${property.price_per_night % 1 === 0 ? property.price_per_night.toFixed(0) : property.price_per_night.toFixed(2)} / night`
                  : "Pick check-in and check-out to calculate."}
              </Text>
            </View>

            <Pressable
              onPress={goBook}
              style={({ pressed }) => [styles.bookNow, pressed && { opacity: 0.92 }]}
            >
              <Text style={styles.bookNowLabel}>Book now</Text>
            </Pressable>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>About this place</Text>
            {rawDesc ? (
              <>
                <Text style={styles.desc}>{descShown}</Text>
                {descLong ? (
                  <Pressable onPress={() => setDescExpanded((e) => !e)} hitSlop={8}>
                    <Text style={styles.readMore}>{descExpanded ? "Show less" : "Read more"}</Text>
                  </Pressable>
                ) : null}
              </>
            ) : (
              <Text style={styles.descMuted}>The host hasn't added a description yet.</Text>
            )}
          </View>

          {amenities.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Amenities</Text>
              <View style={styles.amenityList}>
                {amenities.map((a) => (
                  <View key={a} style={styles.amenityRow}>
                    <Text style={styles.amenityBullet}>•</Text>
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.trustCard}>
            <Text style={styles.trustTitle}>What to expect on arrival</Text>
            <Text style={styles.trustSectionLabel}>Key instructions</Text>
            <Text style={styles.trustBody}>{keyInstructions}</Text>
            <Text style={styles.trustSectionLabel}>Entry & access</Text>
            <Text style={styles.trustBody}>{entryInfo}</Text>
            <Text style={styles.trustSectionLabel}>House rules</Text>
            <Text style={styles.trustBody}>{houseRulesBlock}</Text>
          </View>

          <PropertyReviewsSection
            listingId={property.id}
            averageRating={reviewAvg}
            reviewCount={reviewCount}
            previewRows={property.reviewPreview}
            maxPreview={4}
          />

          <InsuranceLeadForm
            leadType="travel"
            source="bnbhub"
            listingId={property.id}
            headline="Get travel insurance for your stay"
            subheadline="Optional coverage — a licensed partner may contact you only with your consent below."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
  loadingHint: { color: colors.muted, marginTop: 12, fontSize: 14 },
  padded: { flex: 1, padding: 24 },
  scroll: { paddingBottom: 48 },
  topBar: { paddingHorizontal: 20, paddingBottom: 8 },
  back: { color: colors.gold, fontSize: 16, fontWeight: "600" },
  section: { paddingHorizontal: 20, paddingTop: 4 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 8 },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", flex: 1, lineHeight: 32 },
  favBtn: { padding: 6, marginTop: 4 },
  favIcon: { color: colors.gold, fontSize: 24, fontWeight: "600" },
  location: { color: colors.muted, marginTop: 8, fontSize: 15, lineHeight: 21 },
  matchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  matchTag: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  matchTagText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  ratingStar: { fontSize: 16 },
  ratingValue: { color: colors.gold, fontSize: 18, fontWeight: "800" },
  ratingCount: { color: colors.muted, fontSize: 14 },
  bookingCard: {
    marginTop: 22,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  bookingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  bookingTitle: { color: colors.text, fontSize: 18, fontWeight: "800", flexShrink: 1 },
  bookingSub: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 16 },
  hostIdBanner: {
    backgroundColor: "rgba(212,175,55,0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldDim,
  },
  hostIdBannerText: { color: colors.text, fontSize: 13, lineHeight: 19 },
  dateRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  dateField: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dateFieldPressed: { opacity: 0.92 },
  dateLabel: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 4 },
  dateValue: { color: colors.text, fontSize: 16, fontWeight: "700" },
  guestsLabel: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 6 },
  guestsInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 6,
  },
  guestsCap: { color: colors.goldDim, fontSize: 12, marginBottom: 14 },
  totalBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  totalLabel: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 4 },
  totalValue: { color: colors.gold, fontSize: 26, fontWeight: "800" },
  totalMeta: { color: colors.muted, fontSize: 13, marginTop: 6, lineHeight: 18 },
  bookNow: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  bookNowLabel: { color: "#0a0a0a", fontWeight: "900", fontSize: 17 },
  block: { marginTop: 28 },
  blockTitle: { color: colors.text, fontSize: 17, fontWeight: "800", marginBottom: 10 },
  desc: { color: colors.text, lineHeight: 24, fontSize: 15 },
  descMuted: { color: colors.muted, lineHeight: 22, fontSize: 15 },
  readMore: { color: colors.gold, fontWeight: "800", fontSize: 14, marginTop: 10 },
  amenityList: { gap: 8 },
  amenityRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  amenityBullet: { color: colors.gold, fontSize: 16, lineHeight: 22 },
  amenityText: { color: colors.text, fontSize: 15, lineHeight: 22, flex: 1 },
  trustCard: {
    marginTop: 28,
    backgroundColor: colors.surface2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  trustTitle: { color: colors.text, fontSize: 17, fontWeight: "800", marginBottom: 14 },
  trustSectionLabel: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 4,
  },
  trustBody: { color: colors.muted, fontSize: 14, lineHeight: 22, marginBottom: 12 },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
  },
  emptyTitle: { color: colors.text, fontWeight: "700", fontSize: 18, marginBottom: 8 },
  notFound: { color: colors.muted, lineHeight: 22 },
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
    paddingBottom: 16,
    maxHeight: "78%",
  },
  dateSheetTitle: {
    color: colors.gold,
    fontWeight: "800",
    fontSize: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  dateSheetHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  dateCloseBtn: { alignItems: "center", paddingVertical: 12 },
  dateCloseLabel: { color: colors.gold, fontWeight: "800", fontSize: 16 },
});
