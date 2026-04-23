import { Text } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { colors } from "../../theme/colors";

export default function AdminFraud() {
  return (
    <ScreenChrome title="Fraud queue" subtitle="Admin-only evidence">
      <Text style={{ color: colors.textMuted }}>Open `/admin/bnhub/trust` on web — mobile never ships `evidenceJson`.</Text>
    </ScreenChrome>
  );
}
