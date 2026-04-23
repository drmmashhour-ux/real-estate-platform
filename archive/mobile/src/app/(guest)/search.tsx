import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { mobileFetch } from "../../services/apiClient";
import { recordSuccessfulSearch } from "../../lib/review";
import { colors } from "../../theme/colors";

type SearchRes = { listings: Array<{ id: string; title: string; city: string; nightPriceCents: number }> };

export default function GuestSearch() {
  const [city, setCity] = useState("");
  const lastFetchAt = useRef<number>(0);
  const q = useQuery({
    queryKey: ["search", city],
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryFn: () => {
      const qstr = new URLSearchParams();
      if (city.trim()) qstr.set("city", city.trim());
      return mobileFetch<SearchRes>(`/api/mobile/v1/listings/search?${qstr.toString()}`);
    },
  });

  useEffect(() => {
    if (!q.isSuccess || !q.data?.listings?.length) return;
    const ts = q.dataUpdatedAt ?? 0;
    if (ts === lastFetchAt.current) return;
    lastFetchAt.current = ts;
    void recordSuccessfulSearch();
  }, [q.isSuccess, q.data?.listings?.length, q.dataUpdatedAt]);

  return (
    <ScreenChrome title="Search" subtitle="City and filters (expand in product)">
      <TextInput
        style={styles.input}
        placeholder="City"
        placeholderTextColor={colors.textMuted}
        value={city}
        onChangeText={setCity}
        onSubmitEditing={() => void q.refetch()}
      />
      <FlatList
        data={q.data?.listings ?? []}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <Link href={`/(guest)/listing/${item.id}`} asChild>
            <Pressable style={styles.row}>
              <Text style={styles.t}>{item.title}</Text>
              <Text style={styles.m}>{item.city} · ${(item.nightPriceCents / 100).toFixed(0)}</Text>
            </Pressable>
          </Link>
        )}
      />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    marginBottom: 12,
  },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  t: { color: colors.text, fontWeight: "600" },
  m: { color: colors.textMuted, marginTop: 4 },
});
