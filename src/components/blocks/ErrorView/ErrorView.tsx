import React from 'react';
import styled, { css } from 'styled-components/native';

import { getAppRoute } from '@/src/routes';
//import MessageCard from '@/components/blocks/Cards/MessageCard';
//import AppLayout from '@/components/blocks/Layout/AppLayout';

const ErrorWrapper = styled.View`
  ${({ theme }) => css`
    padding: ${theme.spacing.xxsmall};
    @media (min-width: ${theme.breakpoints.medium}) {
      padding: 0px;
    }
  `}
`;

// TODO: reimplement actuall app layout
const AppLayout = styled.View`
  flex: 1;
`;

const RouterError = ({ Layout = AppLayout }) => (
  <Layout>
    <ErrorWrapper>
      {/* <MessageCard TODO: fix actual message card
        title="error_view.title"
        linkText="error_view.button"
        linkTo={getAppRoute('')}
      /> */}
    </ErrorWrapper>
  </Layout>
);

export default RouterError;
