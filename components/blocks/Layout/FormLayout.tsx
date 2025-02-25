import styled from 'styled-components/native';

// import Header from '../Header';

const Wrapper = styled.View`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-sizing: border-box;
`;

const Content = styled.View`
  display: flex;
  justify-content: center;
  flex: 1;
  overflow: hidden;

  ${({ theme }) => `
  padding: ${theme.spacing.small};

  @media (min-width: ${theme.breakpoints.small}) {
      flex: unset;
      padding: ${theme.spacing.large};
    }
  `}
`;

const FormLayout = ({ children }: { children: React.ReactNode }) => (
  <Wrapper>
    {/* <Header /> */}
    <Content>{children}</Content>
  </Wrapper>
);

export default FormLayout;

