import { Button, Card, Text } from '@a-little-world/little-world-design-system-native';
import styled from 'styled-components/native';

export const StyledCard = styled(Card)`
  position: relative;
  max-width: 500px;
  align-self: flex-start;
  flex: 1;

  ${({ theme }) =>
    `@media (max-width: ${theme.breakpoints.small}) {
      padding-top: ${theme.spacing.medium};
      padding-bottom: ${theme.spacing.medium};
    }`}
`;

export const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xxxsmall};
  align-items: flex-start;
  flex-grow: 1;
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

export const NameContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: ${({ theme }) => theme.spacing.xxsmall};
`;

export const NameInputs = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: ${({ theme }) => theme.spacing.xxsmall};
`;

export const FormDescription = styled(Text)`
  margin-bottom: ${({ theme }) => theme.spacing.small};
`;
