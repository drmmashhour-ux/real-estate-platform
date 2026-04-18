import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MobileBrokerHome } from "../../components/broker/MobileBrokerHome";
import { colors } from "../../theme/colors";

export default function BrokerIndexScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <MobileBrokerHome />
      </View>
    </SafeAreaView>
  );
}
