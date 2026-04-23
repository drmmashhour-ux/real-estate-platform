import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../../config";
import { buildAuthHeaders } from "../../../lib/authHeaders";
import { colors } from "../../../theme/colors";

type BookingPayload = {
  id: string;
  listingId: string;
  listingTitle: string | null;
  dates: unknown;
  total: number;
  status: string;
  guestEmail: string | null;
  instructions: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function formatDates(dates: unknown): string {
  if (!Array.isArray(dates) || dates.length === 0) return "—";
  const strs = (dates as unknown[]).filter((d): d is string => typeof d === "string");
  if (strs.length === 0) return "—";
  const sorted = [...strs].sort();
  return `${sorted[0]} → ${sorted[sorted.length - 1]} (${sorted.length} nights)`;
}

export default function HostBookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingPayload | null>(null);
  const [instructionsDraft, setInstructionsDraft] = useState("");

  const load = useCallback(async () => {
    if (!bookingId) {
      setError("Missing booking id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/mobile/v1/bnhub/host/bookings/${encodeURIComponent(bookingId)}`;
      const headers = await buildAuthHeaders();
      const res = await fetch(url, { headers });
      const data = (await res.json().catch(() => ({}))) as { booking?: BookingPayload; error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not load booking.");
        setBooking(null);
        return;
      }
      if (!data.booking) {
        setError("Booking not found.");
        setBooking(null);
        return;
      }
      setBooking(data.booking);
      setInstructionsDraft(data.booking.instructions ?? "");
    } catch {
      setError("Network error.");
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveInstructions() {
    if (!bookingId || saving) return;
    setSaving(true);
    try {
      const url = `${API_BASE_URL.replace(/\/$/, "")}/api/mobile/v1/bnhub/host/bookings/${encodeURIComponent(bookingId)}/instructions`;
      const headers = await buildAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ instructions: instructionsDraft }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        Alert.alert("Could not save", typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
        return;
      }
      Alert.alert("Saved", "Guests only see these notes after they pay.");
      void load();
    } catch {
      Alert.alert("Network error", "Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.hint}>Loading booking…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.err}>{error ?? "Not found"}</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.kicker}>HOST · BOOKING</Text>
        <Text style={styles.title}>{booking.listingTitle ?? "Listing"}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Guest</Text>
          <Text style={styles.value}>{booking.guestEmail ?? "—"}</Text>
          <Text style={[styles.label, styles.labelSp]}>Stay</Text>
          <Text style={styles.value}>{formatDates(booking.dates)}</Text>
          <Text style={[styles.label, styles.labelSp]}>Total</Text>
          <Text style={styles.valueGold}>${booking.total.toFixed(2)}</Text>
          <Text style={[styles.label, styles.labelSp]}>Listing ID</Text>
          <Text style={styles.mono} selectable>
            {booking.listingId}
          </Text>
          <Text style={[styles.label, styles.labelSp]}>Booking ID</Text>
          <Text style={styles.mono} selectable>
            {booking.id}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Guest instructions</Text>
        <Text style={styles.sectionHint}>
          Key location, entry codes, parking, and house rules. Shown to the guest in the app only after payment is
          confirmed.
        </Text>
        <TextInput
          value={instructionsDraft}
          onChangeText={setInstructionsDraft}
          placeholder="e.g. Lockbox 1234 on the railing. Quiet after 10pm."
          placeholderTextColor={colors.muted}
          multiline
          style={styles.input}
          textAlignVertical="top"
        />
        <Pressable
          onPress={() => void saveInstructions()}
          disabled={saving}
          style={({ pressed }) => [styles.saveBtn, saving && { opacity: 0.6 }, pressed && !saving && { opacity: 0.92 }]}
        >
          <Text style={styles.saveBtnLabel}>{saving ? "Saving…" : "Save instructions"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  hint: { color: colors.muted, marginTop: 12 },
  scroll: { padding: 20, paddingBottom: 48 },
  back: { color: colors.gold, fontWeight: "600", fontSize: 16, marginBottom: 16 },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 2, marginBottom: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800", marginBottom: 10 },
  statusPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  statusText: { color: colors.gold, fontWeight: "800", fontSize: 12, textTransform: "uppercase" },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 22,
  },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  labelSp: { marginTop: 14 },
  value: { color: colors.text, fontSize: 16, marginTop: 6 },
  valueGold: { color: colors.gold, fontSize: 22, fontWeight: "800", marginTop: 6 },
  mono: { color: colors.text, fontSize: 12, marginTop: 6 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "800", marginBottom: 8 },
  sectionHint: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    color: colors.text,
    minHeight: 140,
    fontSize: 15,
    marginBottom: 14,
  },
  saveBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnLabel: { color: "#0a0a0a", fontWeight: "900", fontSize: 16 },
  err: { color: colors.danger, fontSize: 15 },
});
