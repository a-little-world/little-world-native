import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';

import LogoImageSvg from '@/assets/images/logo-image.svg';
import LogoTextSvg from '@/assets/images/logo-text.svg';
import { getAppRoute } from '@/components/routes';

enum LogoSizes {
  Small = 'Small',
  Medium = 'Medium',
}

type SizesType = keyof typeof LogoSizes;

const LogoContainer = styled(View)<{ $stacked?: boolean }>`
  display: flex;
  flex-direction: ${({ $stacked }) => ($stacked ? 'column' : 'row')};
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxxsmall};
`;

const LogoImage = ({ $size, ...props }: { $size: SizesType } & any) => (
  <LogoImageSvg 
    style={{
      width: $size === LogoSizes.Small ? 30 : 70,
      height: $size === LogoSizes.Small ? 30 : 70,
    }}
    {...props}
  />
);

export const LogoText = ({ $size, ...props }: { $size: SizesType } & any) => (
  <LogoTextSvg 
    style={{
      width: $size === LogoSizes.Small ? 30 : 80,
      height: $size === LogoSizes.Small ? 15 : 40,
    }}
    {...props}
  />
);

const Wrapper = ({
  asLink,
  children,
}: {
  asLink?: boolean;
  children: React.ReactNode;
}) => {
  const navigation = useNavigation();
  
  if (asLink) {
    return (
      <TouchableOpacity onPress={() => navigation.navigate(getAppRoute())}>
        {children}
      </TouchableOpacity>
    );
  }
  
  return <>{children}</>;
};

interface LogoProps {
  asLink?: boolean;
  style?: any;
  displayImage?: boolean;
  displayText?: boolean;
  stacked?: boolean;
  size?: SizesType;
}

const Logo = ({
  asLink,
  style,
  displayImage = true,
  displayText = true,
  stacked = true,
  size = LogoSizes.Medium,
}: LogoProps) => (
  <Wrapper asLink={asLink}>
    <LogoContainer style={style} $stacked={stacked}>
      {displayImage && (
        <LogoImage $size={size} />
      )}
      {displayText && (
        <LogoText $size={size} />
      )}
    </LogoContainer>
  </Wrapper>
);

export default Logo;
