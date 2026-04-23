import { Text } from "react-native";
import { ScreenChrome } from "../../components/ui/ScreenChrome";
import { colors } from "../../theme/colors";

export default function AdminApprovals() {
  return (
    <ScreenChrome title="Listing approvals" subtitle="PENDING_REVIEW queue">
      <Text style={{ color: colors.textMuted }}>Use web admin BNHub moderation for document review; mobile shows queue counts.</Text>
    </ScreenChrome>
  );
}
