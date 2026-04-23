import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppScreen } from "@/components/AppScreen";
import { SectionCard } from "@/components/SectionCard";
import { theme } from "@/lib/theme";
import { fetchStayById } from "@/services/stays.api";

function formatCadFromCents(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function StayDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stayId = typeof id === "string" ? id : "";

  const q = useQuery({
    queryKey: ["mobile-stay", stayId],
    queryFn: () => fetchStayById(stayId),
    enabled: stayId.length > 0,
  });

  if (!stayId) {
    return (
      <AppScreen>
        <Text style={styles.title}>Missing stay</Text>
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
        <Text style={styles.title}>Could not load stay</Text>
        <Text style={styles.body}>{q.error instanceof Error ? q.error.message : "Unknown error"}</Text>
      </AppScreen>
    );
  }

  const data = q.data;

  return (
    <AppScreen>
      <View style={styles.hero} />
      <Text style={styles.title}>{data.title}</Text>
      <Text style={styles.price}>{formatCadFromCents(data.nightPriceCents)} / night</Text>
      <Text style={styles.meta}>
        {data.city}
        {data.address ? ` · ${data.address}` : ""}
      </Text>

      <SectionCard>
        <Text style={styles.sectionTitle}>Stay details</Text>
        <Text style={styles.body}>{data.description ?? "Host description will appear here."}</Text>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Listing status</Text>
        <Text style={styles.bodyMuted}>{data.listingStatus}</Text>
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
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
