import { Button, Card, Text } from "@a-little-world/little-world-design-system";
import styled from "styled-components";

export const StyledCard = styled(Card)`
  position: relative;
  max-width: 500px;
  align-self: flex-start;
  flex: 1;
`;

export const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-grow: 1;
`;

export const StyledCta = styled(Button)``;

export const Title = styled(Text)`
  text-align: center;
  width: 100%;
`;

export const NameContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const NameInputs = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const FormDescription = styled(Text)``;
