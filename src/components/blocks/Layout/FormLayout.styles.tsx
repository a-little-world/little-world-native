import { StyleSheet } from "react-native";
import { DefaultTheme } from "styled-components/native";

export const getFormLayoutStyles = ({ theme, windowWidth }: { theme: DefaultTheme, windowWidth: number }) => StyleSheet.create({
    wrapper: {
        display: "flex",
        flexDirection: "column",
        // minHeight: "100vh",
        boxSizing: "border-box",
    },
    content: {
        display: "flex",
        justifyContent: "center",
        height: '100%',
        overflow: "hidden",
    }
})