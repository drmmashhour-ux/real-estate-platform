import { StyleSheet, Text } from "react-native";
import MapView, { Circle } from "react-native-maps";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { colors } from "../../theme/colors";

/** Placeholder: overlay `bnhub_restricted_zones` boundaries from policy GeoJSON after API exposes sanitized shapes. */
export default function AdminOperationsMap() {
  return (
    <ScreenChrome title="Operations map" subtitle="Restricted zones + review pins (API next)">
      <MapView
        style={styles.map}
        initialRegion={{ latitude: 45.5, longitude: -73.57, latitudeDelta: 0.2, longitudeDelta: 0.2 }}
      >
        <Circle
          center={{ latitude: 45.52, longitude: -73.58 }}
          radius={1200}
          strokeColor={colors.danger}
          fillColor="rgba(239,68,68,0.15)"
        />
      </MapView>
      <Text style={{ color: colors.textMuted, marginTop: 8 }}>
        Demo circle only — production uses stored policy geofences, not inferred “danger”.
      </Text>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  map: { width: "100%", height: 280, borderRadius: 12 },
});
