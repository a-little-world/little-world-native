import { View } from "react-native";
import { useTheme } from "styled-components/native";
import { CustomThemeProvider as NativeThemeProvider } from "@a-little-world/little-world-design-system-native";

import {
  Loading,
  LoadingType,
  LoadingSizes,
} from "@a-little-world/little-world-design-system-native";
import { getLoadingScreenStyles } from "./LoadingScreen.styles";

const LoadingScreenContent = () => {
  const theme = useTheme();
  const styles = getLoadingScreenStyles(theme);

  return (
    <View style={styles.container}>
      <Loading type={LoadingType.Logo} size={LoadingSizes.Large} />
    </View>
  );
};

export const LoadingScreen = () => {
  return (
    <View style={{ flex: 1, width: "100%", height: "100%" }}>
      <NativeThemeProvider>
        <LoadingScreenContent />
      </NativeThemeProvider>
    </View>
  );
};

export default LoadingScreen;
