import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { GoldButton } from "../../../../components/ui/GoldButton";
import { ScreenChrome } from "../../../../components/ui/ScreenChrome";
import { mobileFetch } from "../../../../services/apiClient";
import { colors } from "../../../../theme/colors";

type BookingOne = {
  booking: {
    listing: { id: string; title: string };
    reviewEligible: boolean;
  };
};

export default function WriteReview() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const q = useQuery({
    queryKey: ["booking", reservationId],
    queryFn: () => mobileFetch<BookingOne>(`/api/mobile/v1/bookings/${reservationId}`),
    enabled: !!reservationId,
  });

  const submit = useMutation({
    mutationFn: () =>
      mobileFetch<{ review: { id: string } }>(`/api/mobile/v1/bookings/${reservationId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: q.data?.booking.listing.id,
          propertyRating: rating,
          comment: comment.trim() || undefined,
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["booking", reservationId] });
      Alert.alert("Thank you", "Your review was submitted.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (e: Error) => Alert.alert("Review not saved", e.message),
  });

  if (q.isLoading) {
    return (
      <ScreenChrome title="Write a review">
        <Text style={styles.muted}>Loading…</Text>
      </ScreenChrome>
    );
  }
  if (q.error || !q.data) {
    return (
      <ScreenChrome title="Write a review">
        <Text style={styles.err}>Could not load booking.</Text>
      </ScreenChrome>
    );
  }

  if (!q.data.booking.reviewEligible) {
    return (
      <ScreenChrome title="Write a review" subtitle={q.data.booking.listing.title}>
        <Text style={styles.muted}>
          Reviews unlock after your stay is completed and the checkout date has passed.
        </Text>
      </ScreenChrome>
    );
  }

  return (
    <ScreenChrome title="Write a review" subtitle={q.data.booking.listing.title}>
      <Text style={styles.label}>Overall rating (1–5)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={String(rating)}
        onChangeText={(t) => {
          const n = parseInt(t, 10);
          if (Number.isFinite(n) && n >= 1 && n <= 5) setRating(n);
        }}
      />
      <Text style={styles.label}>Comment (optional)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="How was your stay?"
        placeholderTextColor={colors.textMuted}
        multiline
        value={comment}
        onChangeText={setComment}
      />
      <GoldButton
        label={submit.isPending ? "Submitting…" : "Submit review"}
        onPress={() => submit.mutate()}
      />
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textMuted, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  muted: { color: colors.textMuted },
  err: { color: colors.danger },
});
