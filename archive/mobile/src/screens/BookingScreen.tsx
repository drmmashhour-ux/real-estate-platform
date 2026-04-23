import { useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { REALTIME_URL } from "../config";
import type { ManagerStackParamList } from "../navigation/types";
import { createBooking } from "../services/api";
import { subscribeLecipmBookingEvents } from "../services/socket";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<ManagerStackParamList, "Booking">;

export function BookingScreen({ route, navigation }: Props) {
  const { listingId, listingTitle } = route.params;
  const insets = useSafeAreaInsets();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestNotes, setGuestNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [trackedBookingId, setTrackedBookingId] = useState<string | null>(null);
  const [liveLine, setLiveLine] = useState<string | null>(null);

  useEffect(() => {
    if (!REALTIME_URL || !trackedBookingId) return;
    return subscribeLecipmBookingEvents((ev, data) => {
      if (data.bookingId !== trackedBookingId) return;
      setLiveLine(`${ev.replace(/_/g, " ")}${data.status ? ` · ${data.status}` : ""}`);
    });
  }, [trackedBookingId]);

  const onSubmit = async () => {
    const ci = checkIn.trim();
    const co = checkOut.trim();
    if (!ci || !co) {
      Alert.alert("Dates required", "Enter check-in and check-out as YYYY-MM-DD.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createBooking({ listingId, checkIn: ci, checkOut: co, guestNotes: guestNotes.trim() || undefined });
      setTrackedBookingId(res.booking.id);
      setLiveLine(`Booking created · ${res.booking.status}`);
      Alert.alert("Booking created", `Status: ${res.booking.status}. You can pay from the payment flow in the classic hub.`, [
        { text: "OK", onPress: () => navigation.popToTop() },
      ]);
    } catch (e) {
      Alert.alert("Could not book", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: 16, paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.label}>Listing</Text>
      <Text style={styles.listingTitle}>{listingTitle ?? listingId}</Text>

      <Text style={styles.label}>Check-in (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        placeholder="2026-04-10"
        placeholderTextColor={colors.muted}
        value={checkIn}
        onChangeText={setCheckIn}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Check-out (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        placeholder="2026-04-14"
        placeholderTextColor={colors.muted}
        value={checkOut}
        onChangeText={setCheckOut}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Notes for host (optional)</Text>
      <TextInput
        style={[styles.input, styles.notes]}
        placeholder="Arrival time, special requests…"
        placeholderTextColor={colors.muted}
        value={guestNotes}
        onChangeText={setGuestNotes}
        multiline
      />

      {liveLine ? (
        <View style={styles.liveBanner}>
          <Text style={styles.liveLabel}>Live</Text>
          <Text style={styles.liveText}>{liveLine}</Text>
        </View>
      ) : null}
      {!REALTIME_URL ? (
        <Text style={styles.realtimeHint}>
          Remote live updates: set EXPO_PUBLIC_REALTIME_URL and run apps/web `pnpm run realtime:socket`.
        </Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.submit, (pressed || submitting) && styles.pressed]}
        onPress={() => void onSubmit()}
        disabled={submitting}
      >
        <Text style={styles.submitText}>{submitting ? "Submitting…" : "Request booking"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 14,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  listingTitle: { color: colors.text, fontSize: 17, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  notes: { minHeight: 100, textAlignVertical: "top" },
  liveBanner: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  liveLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  liveText: { color: colors.text, fontSize: 14 },
  realtimeHint: { color: colors.muted, fontSize: 11, marginTop: 12, lineHeight: 16 },
  submit: {
    marginTop: 28,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: { color: "#0b0b0b", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.85 },
});
