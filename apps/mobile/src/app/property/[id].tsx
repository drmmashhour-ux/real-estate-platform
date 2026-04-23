import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/AppScreen";
import { SectionCard } from "@/components/SectionCard";
import { theme } from "@/lib/theme";
import { fetchListingById } from "@/services/listings.api";

function formatCadFromCents(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listingId = typeof id === "string" ? id : "";

  const q = useQuery({
    queryKey: ["mobile-listing", listingId],
    queryFn: () => fetchListingById(listingId),
    enabled: listingId.length > 0,
  });

  if (!listingId) {
    return (
      <AppScreen>
        <Text style={styles.title}>Missing listing</Text>
      </AppScreen>
    );
  }

  if (q.isPending) {
    return (
      <AppScreen>
        <ActivityIndicator color={theme.colors.gold} style={{ marginTop: 24 }} />
      </AppScreen>
    );
  }

  if (q.isError || !q.data) {
    return (
      <AppScreen>
        <Text style={styles.title}>Could not load listing</Text>
        <Text style={styles.body}>{q.error instanceof Error ? q.error.message : "Unknown error"}</Text>
      </AppScreen>
    );
  }

  const data = q.data;
  const heroUri = data.imageUrl ?? data.gallery[0] ?? null;

  return (
    <AppScreen>
      {heroUri ? (
        <Image source={{ uri: heroUri }} style={styles.heroImage} resizeMode="cover" />
      ) : (
        <View style={styles.heroPlaceholder} />
      )}
      <Text style={styles.title}>{data.title}</Text>
      <Text style={styles.price}>{formatCadFromCents(data.priceCents)}</Text>
      <Text style={styles.meta}>
        {data.city}
        {data.beds != null || data.baths != null
          ? ` · ${data.beds ?? "—"} bd · ${data.baths ?? "—"} ba`
          : ""}
      </Text>

      <SectionCard>
        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.body}>{data.description ?? "No description provided."}</Text>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.bodyMuted}>{data.status}</Text>
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroImage: {
    height: 240,
    borderRadius: 28,
    marginBottom: 18,
    backgroundColor: "#111111",
  },
  heroPlaceholder: {
    height: 240,
    borderRadius: 28,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    marginBottom: 18,
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: "700",
  },
  price: {
    color: theme.colors.gold,
    fontSize: 22,
    marginTop: 8,
    marginBottom: 4,
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  body: {
    color: theme.colors.textMuted,
    lineHeight: 22,
  },
  bodyMuted: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
