import { useTheme } from "@react-navigation/native";
import { useWindowDimensions } from "react-native";
function useResponsive() {
    const { width } = useWindowDimensions();
    const theme = useTheme();
    
    return {
      isSmallScreen: width < parseInt(theme.breakpoints.small, 10),
      isMediumScreen: width >= parseInt(theme.breakpoints.small, 10) && width < parseInt(theme.breakpoints.medium, 10),
      isLargeScreen: width >= parseInt(theme.breakpoints.medium, 10),
      screenWidth: width,
      theme
    };
  }

  export default useResponsive;