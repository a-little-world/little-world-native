import { Dimensions, Platform } from 'react-native';
import { Button, Card, Text } from '@a-little-world/little-world-design-system-native';
import styled from 'styled-components/native';

// Get the window width
const windowWidth = Dimensions.get('window').width;

export const StyledCard = styled(Card)`
  position: relative;
  max-width: 500px;
  align-self: flex-start;
  flex: 1;
  padding-top: ${({ theme }) => 
    windowWidth < 500 ? theme.spacing.medium : theme.spacing.small};
  padding-bottom: ${({ theme }) => 
    windowWidth < 500 ? theme.spacing.medium : theme.spacing.small};
`;
// TODO: re-add the box shadow

export const StyledForm = styled.View`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-grow: 1;
  margin-top: ${({ theme }) => theme.spacing.xxxsmall};
  margin-bottom: ${({ theme }) => theme.spacing.xxxsmall};
`;

export const StyledCta = styled(Button)`
  margin-bottom: ${({ theme }) => theme.spacing.xsmall};
`;

export const Title = styled(Text)`
  text-align: center;
  color: ${({ theme }) => theme.color.text.highlight};
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.medium};
`;

export const NameContainer = styled.View`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.xxsmall};
  margin-bottom: ${({ theme }) => theme.spacing.xxsmall};
`;

export const NameInputs = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.xxsmall};
  margin-bottom: ${({ theme }) => theme.spacing.xxsmall};
`;

export const FormDescription = styled(Text)`
  margin-bottom: ${({ theme }) => theme.spacing.small};
`;
