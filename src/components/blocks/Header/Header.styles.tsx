import { StyleSheet } from "react-native";
import { DefaultTheme } from "styled-components/native";

export const getHeaderStyles = ({ theme, isSmallOrLarger, isTabletOrLarger }: { theme: DefaultTheme, isSmallOrLarger: boolean, isTabletOrLarger: boolean }) =>
  StyleSheet.create({
    logoLink: {
      display: "flex",
      flex: 1,
      minWidth: 100,
    },
    options: {
      display: "flex",
      alignItems: "center",
      paddingLeft: parseInt(theme.spacing.small, 10),
      paddingRight: parseInt(theme.spacing.small, 10),
      ...(isSmallOrLarger && {
        borderLeftWidth: 1,
        borderLeftColor: theme.color.border.minimal,
        borderRightWidth: 1,
        borderRightColor: theme.color.border.minimal,
      }),
    },
    wrapper: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: theme.color.border.subtle,
      padding: isTabletOrLarger ? parseInt(theme.spacing.large, 10) : parseInt(theme.spacing.small, 10),
      backgroundColor: theme.color.surface.primary,
      height: isTabletOrLarger ? 90 : 72,
      zIndex: 10,
      width: "100%",
      shadowOpacity: 0.05,
      shadowRadius: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
      gap: parseInt(theme.spacing.xxxsmall, 10),
    },
    policies: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      gap: parseInt(theme.spacing.xxxsmall, 10),
      justifyContent: "center",
      alignItems: "flex-end",
      textAlign: "right",
    },
  });