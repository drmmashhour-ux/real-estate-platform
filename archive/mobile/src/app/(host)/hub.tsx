import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../config";
import { buildAuthHeaders } from "../../lib/authHeaders";
import { colors } from "../../theme/colors";

type ListingCard = {
  id: string;
  title?: string;
  city?: string;
  nightPriceCents?: number;
  listingStatus?: string;
};

type CalendarReservation = {
  id: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  status: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const extra: Record<string, string> = {};
  if (init?.body && typeof init.body === "string") {
    extra["Content-Type"] = "application/json";
  }
  const headers = await buildAuthHeaders({ ...extra, ...((init?.headers as Record<string, string>) ?? {}) });
  const res = await fetch(url, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(typeof (data as { error?: string }).error === "string" ? (data as { error: string }).error : `HTTP ${res.status}`);
  }
  return data as T;
}

export default function HostHubScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [priceModal, setPriceModal] = useState<{ listingId: string; title: string } | null>(null);
  const [priceUsd, setPriceUsd] = useState("");
  const [promoModal, setPromoModal] = useState<{ listingId: string; title: string } | null>(null);
  const [promoPct, setPromoPct] = useState("10");
  const [promoStart, setPromoStart] = useState("");
  const [promoEnd, setPromoEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [lRes, cRes] = await Promise.all([
        api<{ listings: ListingCard[] }>("/api/mobile/v1/host/listings"),
        api<{ reservations: CalendarReservation[] }>("/api/mobile/v1/host/calendar").catch(() => ({
          reservations: [] as CalendarReservation[],
        })),
      ]);
      setListings(Array.isArray(lRes.listings) ? lRes.listings : []);
      setReservations(Array.isArray(cRes.reservations) ? cRes.reservations : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
      setListings([]);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchListing(listingId: string, body: Record<string, unknown>) {
    setSaving(true);
    try {
      await api(`/api/mobile/v1/host/listings/${listingId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await load();
      Alert.alert("Saved", "Listing updated.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function submitPrice() {
    if (!priceModal) return;
    const n = Number(priceUsd.replace(/,/g, "."));
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert("Price", "Enter a valid nightly price in USD.");
      return;
    }
    setPriceModal(null);
    await patchListing(priceModal.listingId, { nightPriceUsd: n });
  }

  async function submitPromo() {
    if (!promoModal) return;
    const pct = parseInt(promoPct, 10);
    if (!Number.isFinite(pct) || pct < 1 || pct > 90) {
      Alert.alert("Promotion", "Discount must be 1–90%.");
      return;
    }
    if (!promoStart.trim() || !promoEnd.trim()) {
      Alert.alert("Promotion", "Use YYYY-MM-DD for start and end.");
      return;
    }
    setSaving(true);
    try {
      await api(`/api/mobile/v1/host/listings/${promoModal.listingId}/promotions`, {
        method: "POST",
        body: JSON.stringify({
          discountPercent: pct,
          startDate: promoStart.trim(),
          endDate: promoEnd.trim(),
          active: true,
        }),
      });
      setPromoModal(null);
      Alert.alert("Promotion", "Promotion created. Quotes can apply it when checkout reads host promotions.");
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>HOST</Text>
        <Text style={styles.title}>Quick actions</Text>
        <Text style={styles.lead}>Edit price, visibility, promotions, and message guests on Prisma bookings.</Text>

        <Pressable
          style={({ pressed }) => [styles.btnOutline, pressed && { opacity: 0.9 }, { marginBottom: 16 }]}
          onPress={() => router.push("/ai-control")}
        >
          <Text style={styles.btnOutlineLabel}>AI autonomy status</Text>
        </Pressable>

        {loading ? <ActivityIndicator color={colors.gold} style={{ marginVertical: 24 }} /> : null}
        {err ? <Text style={styles.err}>{err}</Text> : null}

        {!loading &&
          listings.map((L) => (
            <View key={L.id} style={styles.card}>
              <Text style={styles.cardTitle}>{L.title ?? "Listing"}</Text>
              <Text style={styles.cardMeta}>
                {L.city ?? ""}
                {typeof L.nightPriceCents === "number" ? ` · $${(L.nightPriceCents / 100).toFixed(0)}/night` : ""}
                {L.listingStatus ? ` · ${L.listingStatus}` : ""}
              </Text>
              <View style={styles.row}>
                <Pressable
                  style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
                  onPress={() => {
                    setPriceUsd(
                      typeof L.nightPriceCents === "number" ? String(L.nightPriceCents / 100) : ""
                    );
                    setPriceModal({ listingId: L.id, title: L.title ?? "Listing" });
                  }}
                >
                  <Text style={styles.btnLabel}>Edit price</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
                  onPress={() => void patchListing(L.id, { toggleListed: true })}
                  disabled={saving}
                >
                  <Text style={styles.btnLabel}>Toggle listed</Text>
                </Pressable>
              </View>
              <View style={styles.row}>
                <Pressable
                  style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
                  onPress={() => setPromoModal({ listingId: L.id, title: L.title ?? "Listing" })}
                >
                  <Text style={styles.btnLabel}>Add promotion</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.btnOutline, pressed && { opacity: 0.9 }]}
                  onPress={() => router.push("/(host)/payout-status")}
                >
                  <Text style={styles.btnOutlineLabel}>Payouts</Text>
                </Pressable>
              </View>
            </View>
          ))}

        <Text style={styles.section}>Bookings — message guest</Text>
        {reservations.slice(0, 25).map((r) => (
          <Pressable
            key={r.id}
            style={({ pressed }) => [styles.resRow, pressed && { opacity: 0.9 }]}
            onPress={() => router.push({ pathname: "/(host)/booking-chat", params: { bookingId: r.id } })}
          >
            <Text style={styles.resTitle}>{r.id.slice(0, 8)}…</Text>
            <Text style={styles.resMeta}>
              {r.checkIn.slice(0, 10)} → {r.checkOut.slice(0, 10)} · {r.status}
            </Text>
            <Text style={styles.resCta}>Open chat →</Text>
          </Pressable>
        ))}
        {reservations.length === 0 && !loading ? (
          <Text style={styles.muted}>No upcoming reservations in host calendar, or calendar failed to load.</Text>
        ) : null}
      </ScrollView>

      <Modal visible={priceModal != null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nightly price (USD)</Text>
            <Text style={styles.modalSub}>{priceModal?.title}</Text>
            <TextInput
              value={priceUsd}
              onChangeText={setPriceUsd}
              keyboardType="decimal-pad"
              placeholder="e.g. 129"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setPriceModal(null)} style={styles.modalCancel}>
                <Text style={styles.modalCancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void submitPrice()} style={styles.modalOk}>
                <Text style={styles.modalOkLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={promoModal != null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Promotion</Text>
            <Text style={styles.modalSub}>{promoModal?.title}</Text>
            <Text style={styles.fieldLabel}>Discount %</Text>
            <TextInput
              value={promoPct}
              onChangeText={setPromoPct}
              keyboardType="number-pad"
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>Start (YYYY-MM-DD)</Text>
            <TextInput value={promoStart} onChangeText={setPromoStart} style={styles.input} placeholder="2026-06-01" />
            <Text style={styles.fieldLabel}>End (YYYY-MM-DD)</Text>
            <TextInput value={promoEnd} onChangeText={setPromoEnd} style={styles.input} placeholder="2026-08-31" />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setPromoModal(null)} style={styles.modalCancel}>
                <Text style={styles.modalCancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void submitPromo()} style={styles.modalOk} disabled={saving}>
                <Text style={styles.modalOkLabel}>Activate</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 48 },
  kicker: { color: colors.gold, fontWeight: "800", letterSpacing: 2, fontSize: 11 },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 8 },
  lead: { color: colors.muted, marginTop: 10, lineHeight: 22, marginBottom: 16 },
  err: { color: colors.danger, marginBottom: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  cardMeta: { color: colors.muted, marginTop: 6, fontSize: 13 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  btn: {
    backgroundColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnLabel: { color: "#0a0a0a", fontWeight: "800", fontSize: 13 },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnOutlineLabel: { color: colors.gold, fontWeight: "800", fontSize: 13 },
  section: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 20, marginBottom: 10 },
  resRow: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  resTitle: { color: colors.text, fontWeight: "700" },
  resMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  resCta: { color: colors.gold, fontWeight: "800", marginTop: 8, fontSize: 13 },
  muted: { color: colors.muted, fontSize: 14 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  modalSub: { color: colors.muted, marginTop: 6, marginBottom: 14 },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    marginBottom: 12,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 12 },
  modalCancelLabel: { color: colors.muted, fontWeight: "700" },
  modalOk: { backgroundColor: colors.gold, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  modalOkLabel: { color: "#0a0a0a", fontWeight: "800" },
});
