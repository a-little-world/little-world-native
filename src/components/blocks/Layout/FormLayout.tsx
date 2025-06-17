import { useTheme } from "styled-components/native";
import { Dimensions, View } from "react-native";

import Header from "../Header/Header";
import { getFormLayoutStyles } from "./FormLayout.styles";

const windowWidth = Dimensions.get("window").width;

const FormLayout = ({ children }: { children: React.ReactNode }) => {
  const theme = useTheme()
  const styles = getFormLayoutStyles({ theme, windowWidth })
  return (
    <View style={styles.wrapper}>
      {/* <Header /> */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

export default FormLayout;
