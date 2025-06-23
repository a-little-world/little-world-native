import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { TextTypes } from "@a-little-world/little-world-design-system-core";
import { Text, Link } from "@a-little-world/little-world-design-system-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

import { useWindowDimensions, Pressable, View } from "react-native";

import {
  PRIVACY_ROUTE,
  TERMS_ROUTE,
  WP_HOME_ROUTE,
  getAppRoute,
  getHomeRoute,
} from "@/src/routes";
import Logo from "../../atoms/Logo";
import LanguageSelector from "../LanguageSelector/LanguageSelector";
import { getHeaderStyles } from "./Header.styles";

// Define breakpoints
const BREAKPOINTS = {
  small: 576,
  medium: 768,
};

const Header = () => {
  const {
    i18n: { language },
    t,
  } = useTranslation();
  const router = useRouter();
  const userId = "abc"; // useSelector(state => state.userData?.user?.id);
  const { width } = useWindowDimensions();

  const isSmallOrLarger = width >= BREAKPOINTS.small;
  const isTabletOrLarger = width >= BREAKPOINTS.medium;

  const theme = useTheme();

  const handleLogoPress = () => {
    if (userId) {
      router.navigate(getAppRoute());
    } else {
      router.navigate(WP_HOME_ROUTE);
    }
  };

  const { wrapper, logoLink, options, policies } = getHeaderStyles({
    theme,
    isSmallOrLarger,
    isTabletOrLarger,
  });

  return (
    <React.Fragment>
      <View style={wrapper}>
        <Pressable style={logoLink} onPress={handleLogoPress}>
          <Logo stacked={false} />
        </Pressable>
        <View style={options}>
          <LanguageSelector />
        </View>
        <View style={policies}>
          <Link
            href={getHomeRoute(language, TERMS_ROUTE)}
            textType={TextTypes.Body6}
          >
            {t("header.terms")}
          </Link>
          <Link
            href={getHomeRoute(language, PRIVACY_ROUTE)}
            textType={TextTypes.Body6}
          >
            {t("header.privacy")}
          </Link>
        </View>
      </View>
    </React.Fragment>
  );
};

export default Header;
