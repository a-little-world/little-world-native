import {
  ButtonAppearance,
  ButtonSizes,
  //Link,
  //MessageTypes,
  //StatusMessage,
  TextInput,
  TextTypes,
} from '@a-little-world/little-world-design-system-native';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
// import { useDispatch } from 'react-redux';
// import { useNavigate, useSearchParams } from 'react-router-dom';

import { login } from '@/components/api';
//import { initialise } from '@/components/features/userData';
import { onFormError, registerInput } from '@/components/helpers/form.ts';
//import {
//  FORGOT_PASSWORD_ROUTE,
//  SIGN_UP_ROUTE,
//} from '@/components/routes';
import { StyledCard, StyledCta, StyledForm, Title } from './SignUp.styles';

const t = (key) => key;

const Login = () => {
  // const dispatch = useDispatch();
  //const { t } = useTranslation();
  // const [searchParams] = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    setError,
    setFocus,
  } = useForm({ shouldUnregister: true });

  //const navigate = useNavigate(); TODO

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onError = e => {
    setIsSubmitting(false);
    onFormError({ e, formFields: getValues(), setError });
  };

  const onFormSubmit = async data => {
    setIsSubmitting(true);

    login(data)
      .then(loginData => {
        //dispatch(initialise(loginData));
        setIsSubmitting(false);

        //passAuthenticationBoundary(); TODO

        if (!loginData.user.emailVerified) {
          //navigate(getAppRoute(VERIFY_EMAIL_ROUTE)); TODO
        } else if (!loginData.user.userFormCompleted) {
          //navigate(getAppRoute(USER_FORM_ROUTE)); TODO
        } else if (/*searchParams.get('next')*/false) {
          // users can be redirected from /login?next=<url>
          // consider this route after the requried for entry forms verify-email / user-form
          // we add missing front `/` otherwise 'app' would incorrectly navigate to /login/app
          //navigate(
          //  searchParams.get('next').startsWith('/') ?
          //    searchParams.get('next') :
          //    `/${searchParams.get('next')}`,
          //);
        } else {
          // per default route to /app on successful login
          //navigate(getAppRoute()); TODO
        }
      })
      .catch(onError);
  };

  return (
    <StyledCard>
      <Title tag="h2" type={TextTypes.Heading4}>
        {t('login.title')}
      </Title>
   </StyledCard>
  );
};

export default Login;
