import { useTheme } from "styled-components/native";
import { Dimensions, View, SafeAreaView } from "react-native";

import Header from "../Header/Header";
import { getFormLayoutStyles } from "./FormLayout.styles";

const FormLayout = ({ children }: { children: React.ReactNode }) => {
  const theme = useTheme()
  const windowWidth = Dimensions.get("window").width;
  const styles = getFormLayoutStyles({ theme, windowWidth })
  
  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

export default FormLayout;
