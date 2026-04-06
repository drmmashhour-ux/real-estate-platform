import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PropertyCard from "../components/PropertyCard";
import PropertyCardSkeleton from "../components/PropertyCardSkeleton";
import { API_BASE_URL } from "../config";
import { recordSuccessfulSearch } from "../lib/review";
import { trackBnhubEvent } from "../lib/bnhubTrack";
import { colors } from "../theme/colors";

type AiListing = {
  id: string;
  title: string;
  city: string | null;
  price_per_night: number;
  cover_image_url: string | null;
  score: number;
  reasons: string[];
  latitude?: number | null;
  longitude?: number | null;
};

type AiSearchResponse = {
  parsed?: { intent?: string; city?: string | null; maxPrice?: number | null };
  listings?: AiListing[];
  error?: string;
};

const SUGGESTIONS = [
  "Montreal under $250/night",
  "Best investment property",
  "Family-friendly stay",
  "Luxury downtown stay",
];

function formatPricePerNight(n: number) {
  if (Number.isNaN(n)) return "—";
  const s = n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
  return `$${s} / night`;
}

export default function AiSearchScreen() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AiListing[]>([]);
  const [parsedHint, setParsedHint] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const runSearch = useCallback(async () => {
    const query = q.trim();
    if (!query) {
      setError("Enter a search.");
      return;
    }
    setLoading(true);
    setError(null);
    setParsedHint(null);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/search/ai`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = (await res.json().catch(() => ({}))) as AiSearchResponse;
      if (!res.ok) {
        setResults([]);
        const msg = typeof data.error === "string" ? data.error : "Search failed.";
        setError(msg);
        if (__DEV__) console.warn("[bnhub/search] HTTP", res.status, msg);
        return;
      }
      const listings = Array.isArray(data.listings) ? data.listings : [];
      setResults(listings);
      if (listings.length > 0) void recordSuccessfulSearch();
      void trackBnhubEvent("search_query", { queryLen: query.length, resultCount: listings.length });
      const p = data.parsed;
      if (p) {
        const bits: string[] = [];
        if (p.intent) bits.push(`Intent: ${p.intent}`);
        if (p.city) bits.push(p.city);
        if (p.maxPrice != null) bits.push(`≤ $${p.maxPrice}/night`);
        setParsedHint(bits.length ? bits.join(" · ") : null);
      }
    } catch (e) {
      setResults([]);
      const msg = "Network error — check EXPO_PUBLIC_API_BASE_URL.";
      setError(msg);
      if (__DEV__) console.warn("[bnhub/search] fetch failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void runSearch();
            }}
            tintColor={colors.gold}
          />
        }
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.kicker}>AI SEARCH</Text>
        <Text style={styles.head}>Find your stay</Text>
        <Text style={styles.lead}>
          Natural-language search runs on the platform: parsing and ranking stay on the server — the app only sends your query.
        </Text>

        <View style={styles.searchCard}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="e.g. 2 bedroom Montreal under 250 a night"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={() => void runSearch()}
          />
          <Pressable
            onPress={() => void runSearch()}
            style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.92 }]}
            disabled={loading}
          >
            <Text style={styles.searchBtnLabel}>{loading ? "Searching…" : "Search"}</Text>
          </Pressable>
        </View>

        <Text style={styles.chipsKicker}>TRY</Text>
        <View style={styles.chips}>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} onPress={() => setQ(s)} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.9 }]}>
              <Text style={styles.chipLabel}>{s}</Text>
            </Pressable>
          ))}
        </View>

        {parsedHint ? <Text style={styles.parsedHint}>{parsedHint}</Text> : null}

        {loading && results.length === 0
          ? [0, 1, 2].map((k) => <PropertyCardSkeleton key={`ai-sk-${k}`} />)
          : null}

        {error ? (
          <View style={styles.errCard}>
            <Text style={styles.err}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && results.length === 0 && q.trim() ? (
          <Text style={styles.muted}>No matches. Try a broader city or higher budget.</Text>
        ) : null}

        {results.map((item, idx) => {
          const showTopChoice = idx === 0 || item.score >= 88;
          const loc = item.city?.trim();
          return (
            <PropertyCard
              key={item.id}
              listingId={item.id}
              title={item.title}
              locationLine={loc ? loc : null}
              featureLabels={item.reasons}
              coverUrl={item.cover_image_url}
              priceLabel={formatPricePerNight(item.price_per_night)}
              starRating={null}
              reviewCount={null}
              showTopChoice={showTopChoice}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/property",
                  params: {
                    id: item.id,
                    rankTags: item.reasons.slice(0, 4).join("|"),
                  },
                })
              }
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingBottom: 40 },
  back: { color: colors.gold, fontWeight: "600", fontSize: 16, marginBottom: 16 },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 8 },
  head: { color: colors.gold, fontSize: 26, fontWeight: "700", marginBottom: 10 },
  lead: { color: colors.muted, lineHeight: 22, marginBottom: 20, fontSize: 14 },
  searchCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 18,
  },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  searchBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  searchBtnLabel: { color: "#0a0a0a", fontWeight: "800", fontSize: 15 },
  chipsKicker: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  chipLabel: { color: colors.text, fontSize: 13, fontWeight: "600" },
  parsedHint: { color: colors.muted, fontSize: 12, marginBottom: 14, lineHeight: 18 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  errCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  err: { color: colors.danger, lineHeight: 20 },
});
