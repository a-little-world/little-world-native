import { Link, TextTypes } from '@a-little-world/little-world-design-system-native';
import { useTranslation } from 'react-i18next';
// import { useSelector } from 'react-redux';
import styled from 'styled-components/native';
import { useWindowDimensions } from 'react-native';

import {
  PRIVACY_ROUTE,
  TERMS_ROUTE,
  WP_HOME_ROUTE,
  getAppRoute,
  getHomeRoute,
} from '@/components/routes';
import Logo from '../atoms/Logo.tsx';
import LanguageSelector from './LanguageSelector/LanguageSelector';

// Define breakpoints
const BREAKPOINTS = {
  small: 576,
  medium: 768,
};

const StyledHeader = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.color.border.subtle};
  padding: ${({ theme, isTabletOrLarger }) => isTabletOrLarger ? theme.spacing.large : theme.spacing.small};
  background-color: ${({ theme }) => theme.color.surface.primary};
  height: ${({ isTabletOrLarger }) => isTabletOrLarger ? '90px' : '72px'};
  z-index: 10;
  width: 100%;
  shadow-opacity: 0.05;
  shadow-radius: 5px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  elevation: 2;
  gap: ${({ theme }) => theme.spacing.xxxsmall};
`;

const Policies = styled.View`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxsmall};
  justify-content: center;
  align-items: flex-end;
  text-align: right;
`;

const Options = styled.View`
  display: flex;
  align-items: center;
  padding-left: ${({ theme }) => theme.spacing.small};
  padding-right: ${({ theme }) => theme.spacing.small};
  ${({ theme, isSmallOrLarger }) => isSmallOrLarger && `
    border-left-width: 1px;
    border-left-color: ${theme.color.border.minimal};
    border-right-width: 1px;
    border-right-color: ${theme.color.border.minimal};
  `}
`;

const LogoLink = styled.TouchableOpacity`
  display: flex;
  flex: 1;
  min-width: 100px;
`;

const Header = () => {
  const {
    i18n: { language },
    t,
  } = useTranslation();
  const userId = "abc"; // useSelector(state => state.userData?.user?.id);
  const { width } = useWindowDimensions();
  
  const isSmallOrLarger = width >= BREAKPOINTS.small;
  const isTabletOrLarger = width >= BREAKPOINTS.medium;

  return (
    <StyledHeader isTabletOrLarger={isTabletOrLarger}>
      <LogoLink href={userId ? getAppRoute() : WP_HOME_ROUTE}>
        <Logo stacked={false} />
      </LogoLink>
      <Options isSmallOrLarger={isSmallOrLarger}>
        <LanguageSelector />
      </Options>
      <Policies>
        <Link
          href={getHomeRoute(language, TERMS_ROUTE)}
          textType={TextTypes.Body6}
        >
          {t('header.terms')}
        </Link>
        <Link
          href={getHomeRoute(language, PRIVACY_ROUTE)}
          textType={TextTypes.Body6}
        >
          {t('header.privacy')}
        </Link>
      </Policies>
    </StyledHeader>
  );
};

export default Header;
