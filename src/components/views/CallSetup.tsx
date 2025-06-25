import {
  Button,
  Popover,
  Text,
} from "@a-little-world/little-world-design-system-native";
import { StyleSheet } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { ButtonAppearance } from "@a-little-world/little-world-design-system-core";
import { useNavigation, useTheme } from "@react-navigation/native";
import { CALL_SETUP_ROUTE, LOGIN_ROUTE } from "@/src/routes";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
});

function CallSetup() {
  const navigation = useNavigation();
  const theme = useTheme();
  
  return (
    <SafeAreaView style={styles.container}>
      <Text>Temporary Home Page to test different app pages</Text>
      <Button onPress={() => navigation.navigate(LOGIN_ROUTE)}>
        <Text>To Login</Text>
      </Button>
      <Button onPress={() => navigation.navigate(CALL_SETUP_ROUTE)}>
        <Text>To Call Setup</Text>
      </Button>
      <Popover
        asToolTip
        showCloseButton={false}
        trigger={
          <Button appearance={ButtonAppearance.Secondary}>
            <Text>Open Popover</Text>
          </Button>
        }
      >
        <Text>This is tooltip text with tooltip styling</Text>
      </Popover>
    </SafeAreaView>
  );
}



export default CallSetup;
