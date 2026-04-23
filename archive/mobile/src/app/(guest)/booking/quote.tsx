import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { GoldButton } from "../../../components/ui/GoldButton";
import { ScreenChrome } from "../../../components/ui/ScreenChrome";
import { useAppAuth } from "../../../hooks/useAuth";
import { API_BASE_URL } from "../../../config";
import { mobileFetch } from "../../../services/apiClient";
import { colors } from "../../../theme/colors";

type ListingPayload = {
  listing: {
    id: string;
    title: string;
    safety: { bookingAllowed: boolean; guestMessage: string };
  };
};

type PricingResult = {
  breakdown: {
    nights: number;
    subtotalCents: number;
    cleaningFeeCents: number;
    taxCents: number;
    serviceFeeCents: number;
    totalCents: number;
  };
};

export default function BookingQuote() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAppAuth();
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const q = useQuery({
    queryKey: ["listing-quote", id],
    queryFn: () => mobileFetch<ListingPayload>(`/api/mobile/v1/listings/${id}`),
    enabled: !!id,
  });

  const pricing = useQuery({
    queryKey: ["pricing", id, checkIn, checkOut],
    queryFn: async () => {
      const base = API_BASE_URL.replace(/\/$/, "");
      const u = new URL(`${base}/api/bnhub/pricing/breakdown`);
      u.searchParams.set("listingId", id!);
      u.searchParams.set("checkIn", checkIn!);
      u.searchParams.set("checkOut", checkOut!);
      const res = await fetch(u.toString(), { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Pricing failed");
      }
      return res.json() as Promise<PricingResult>;
    },
    enabled: Boolean(id && checkIn && checkOut),
  });

  const createBooking = useMutation({
    mutationFn: () =>
      mobileFetch<{ booking: { id: string; status: string } }>("/api/mobile/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: id,
          checkIn: checkIn!,
          checkOut: checkOut!,
        }),
      }),
    onSuccess: (data) => {
      const bid = data.booking.id;
      const st = data.booking.status;
      if (st === "PENDING") {
        router.push({
          pathname: "/payment",
          params: {
            bookingId: bid,
            title: q.data?.listing.title ?? "Stay",
            nights: String(pricing.data?.breakdown.nights ?? "—"),
            total: pricing.data ? String((pricing.data.breakdown.totalCents / 100).toFixed(2)) : "",
          },
        });
        return;
      }
      if (st === "AWAITING_HOST_APPROVAL") {
        Alert.alert(
          "Request sent",
          "The host will confirm your dates. You’ll be able to pay once they approve.",
          [{ text: "OK", onPress: () => router.replace("/(guest)/bookings") }]
        );
        return;
      }
      router.replace(`/(guest)/bookings/${bid}`);
    },
    onError: (e: Error) => {
      Alert.alert("Could not book", e.message || "Try different dates or sign in again.");
    },
  });

  const marked = useMemo(() => {
    const m: Record<string, { selected?: boolean; selectedColor?: string }> = {};
    if (checkIn) m[checkIn] = { selected: true, selectedColor: colors.gold };
    if (checkOut) m[checkOut] = { selected: true, selectedColor: colors.goldDim };
    return m;
  }, [checkIn, checkOut]);

  const onDayPress = (day: DateData) => {
    const d = day.dateString;
    if (!selectingEnd || !checkIn) {
      setCheckIn(d);
      setCheckOut(null);
      setSelectingEnd(true);
      return;
    }
    if (d <= checkIn) {
      setCheckIn(d);
      setCheckOut(null);
      return;
    }
    setCheckOut(d);
    setSelectingEnd(false);
  };

  const allowed = q.data?.listing.safety.bookingAllowed === true;

  if (!session) {
    return (
      <ScreenChrome title="Book stay" subtitle="Account required">
        <Text style={styles.muted}>Sign in or create an account to complete a reservation.</Text>
        <GoldButton label="Sign in" onPress={() => router.push("/(auth)/sign-in")} />
        <View style={{ height: 12 }} />
        <GoldButton label="Create account" onPress={() => router.push("/(auth)/sign-up")} />
      </ScreenChrome>
    );
  }

  return (
    <ScreenChrome title="Book stay" subtitle={q.data?.listing.title ?? ""}>
      {q.isLoading ? <Text style={styles.muted}>Loading…</Text> : null}
      {q.error ? <Text style={styles.err}>Could not load listing.</Text> : null}
      {q.data && !allowed ? (
        <Text style={styles.err}>
          This listing can’t be booked right now. {q.data.listing.safety.guestMessage}
        </Text>
      ) : null}
      {q.data && allowed ? (
        <>
          <Text style={styles.h}>Select check-in, then check-out</Text>
          <Calendar
            markedDates={marked}
            onDayPress={onDayPress}
            theme={{
              calendarBackground: colors.bg,
              dayTextColor: colors.text,
              textDisabledColor: colors.textMuted,
              monthTextColor: colors.gold,
              arrowColor: colors.gold,
            }}
          />
          {checkIn ? (
            <Text style={styles.muted}>
              Check-in {checkIn}
              {checkOut ? ` · Check-out ${checkOut}` : " · tap checkout date"}
            </Text>
          ) : null}
          {pricing.isFetching ? <Text style={styles.muted}>Calculating price…</Text> : null}
          {pricing.data ? (
            <View style={styles.box}>
              <Text style={styles.priceLine}>
                {pricing.data.breakdown.nights} nights · total ${(pricing.data.breakdown.totalCents / 100).toFixed(2)}
              </Text>
              <Text style={styles.small}>
                Includes cleaning, taxes, and guest service fee (see web for full breakdown).
              </Text>
            </View>
          ) : null}
          {pricing.error ? <Text style={styles.err}>{(pricing.error as Error).message}</Text> : null}
          <GoldButton
            label={createBooking.isPending ? "Creating…" : "Continue to payment"}
            onPress={() => {
              if (!checkIn || !checkOut) {
                Alert.alert("Dates", "Choose check-in and check-out.");
                return;
              }
              createBooking.mutate();
            }}
          />
        </>
      ) : null}
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  h: { color: colors.text, fontWeight: "700", marginBottom: 8 },
  muted: { color: colors.textMuted, marginBottom: 12 },
  err: { color: colors.danger, marginBottom: 12 },
  box: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
  },
  priceLine: { color: colors.gold, fontWeight: "800", fontSize: 18 },
  small: { color: colors.textMuted, marginTop: 6, fontSize: 12 },
});
