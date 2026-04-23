import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AppScreen } from "@/components/AppScreen";
import { SectionCard } from "@/components/SectionCard";
import { theme } from "@/lib/theme";
import { fetchListings, type MobileListingCard } from "@/services/listings.api";
import { fetchStays, type MobileStayCard } from "@/services/stays.api";

type Filter = "buy" | "rent" | "bnhub";

function formatCadFromCents(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function SearchTab() {
  const [filter, setFilter] = useState<Filter>("buy");

  const listingsQ = useQuery({
    queryKey: ["mobile-listings-search"],
    queryFn: fetchListings,
    enabled: filter === "buy" || filter === "rent",
  });

  const staysQ = useQuery({
    queryKey: ["mobile-stays-search"],
    queryFn: fetchStays,
    enabled: filter === "bnhub",
  });

  const listingRows = listingsQ.data?.listings ?? [];
  const stayRows = staysQ.data?.stays ?? [];

  const rentPlaceholder = filter === "rent";

  const rows = useMemo(() => {
    if (filter === "bnhub") {
      return stayRows.map((s: MobileStayCard) => ({
        key: `stay-${s.id}`,
        href: `/stay/${s.id}` as const,
        title: s.title,
        subtitle: s.city,
        priceLine: `${formatCadFromCents(s.nightPriceCents)} / night`,
      }));
    }
    if (rentPlaceholder) {
      return [];
    }
    return listingRows.map((l: MobileListingCard) => ({
      key: `listing-${l.id}`,
      href: `/property/${l.id}` as const,
      title: l.title,
      subtitle: l.city,
      priceLine: formatCadFromCents(l.priceCents),
    }));
  }, [filter, listingRows, rentPlaceholder, stayRows]);

  const loading =
    ((filter === "buy" || filter === "rent") && listingsQ.isPending) ||
    (filter === "bnhub" && staysQ.isPending);

  const error =
    (filter === "buy" || filter === "rent") && listingsQ.isError ? listingsQ.error :
    filter === "bnhub" && staysQ.isError ? staysQ.error :
    null;

  return (
    <AppScreen>
      <Text style={styles.title}>Search</Text>

      <TextInput
        placeholder="Search by city, address, or listing ID"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={styles.searchInput}
      />

      <View style={styles.filters}>
        <FilterChip label="Buy" active={filter === "buy"} onPress={() => setFilter("buy")} />
        <FilterChip label="Rent" active={filter === "rent"} onPress={() => setFilter("rent")} />
        <FilterChip label="BNHub" active={filter === "bnhub"} onPress={() => setFilter("bnhub")} />
      </View>

      <SectionCard>
        <Text style={styles.sectionTitle}>Results</Text>

        {loading ? (
          <ActivityIndicator color={theme.colors.gold} style={{ marginVertical: 20 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error instanceof Error ? error.message : "Failed to load"}</Text>
        ) : rentPlaceholder ? (
          <Text style={styles.muted}>Long-term rent search is coming soon. Use Buy for FSBO sales or BNHub for stays.</Text>
        ) : rows.length === 0 ? (
          <Text style={styles.muted}>No listings match yet. Pull to refresh after your API is reachable.</Text>
        ) : (
          <View style={styles.list}>
            {rows.map((item) => (
              <Link key={item.key} href={item.href} style={styles.resultCard}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultMeta}>{item.subtitle}</Text>
                <Text style={styles.resultPrice}>{item.priceLine}</Text>
              </Link>
            ))}
          </View>
        )}
      </SectionCard>
    </AppScreen>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
      <Text style={active ? styles.filterChipActive : styles.filterChip}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 14,
  },
  filters: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 16,
  },
  filterChip: {
    color: theme.colors.textMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  filterChipActive: {
    color: "#000",
    backgroundColor: theme.colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "600",
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 14,
  },
  list: {
    gap: 10,
  },
  resultCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#111111",
    borderRadius: 20,
    padding: 16,
  },
  resultTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  resultMeta: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  resultPrice: {
    color: theme.colors.gold,
    marginTop: 6,
  },
  muted: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: "#f87171",
    fontSize: 13,
  },
});
