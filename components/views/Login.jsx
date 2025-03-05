import {
  ButtonAppearance,
  ButtonVariations,
  ButtonSizes,
  Link,
  //MessageTypes,
  //StatusMessage,
  TextInput,
  TextProps,
  Button,
  TextTypes,
} from '@a-little-world/little-world-design-system-native';
import {
  Button as NonNativeButton
} from '@a-little-world/little-world-design-system';
import { StyledElement, TextTest } from '../StyledTest';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import i18next from '@/components/i18n'; // DON"T remove! impoant for translations to work!
import { useTranslation } from 'react-i18next';
// import { useDispatch } from 'react-redux';
// import { useNavigate, useSearchParams } from 'react-router-dom';

import { login } from '@/components/api';
//import { initialise } from '@/components/features/userData';
import { onFormError, registerInput } from '@/components/helpers/form.ts';
import { Title, TitleColored } from './SignUp.styles';
import {
  FORGOT_PASSWORD_ROUTE,
} from '@/components/routes';
import { StyledCard, StyledCta, StyledForm } from './SignUp.styles';

// const t = (key) => key;

import styled, { useTheme } from 'styled-components/native';
import { Text, View } from 'react-native';

// Test with progressively more complex styling
const SimpleText = styled.Text`
  color: red;
`;

const MediumText = styled.Text`
  color: blue;
  font-size: 16px;
  ${props => props.bold ? 'font-weight: bold;' : ''}
`;

const ComplexText = styled.Text`
  color: green;
  font-size: 18px;
  ${props => props.bold ? 'font-weight: bold;' : ''}
  ${props => props.center ? 'text-align: center;' : ''}
`;


function TestComponent() {
  return (
    <View>
      <SimpleText>Simple Text</SimpleText>
      <MediumText bold>Medium Text</MediumText>
      <ComplexText bold center>Complex Text</ComplexText>
    </View>
  );
}


const Login = () => {
  // const dispatch = useDispatch();
  //const { t } = useTranslation();
  const { t } = useTranslation();
  // const [searchParams] = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useTheme();
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
  
  const [isActive, setIsActive] = useState(false);

  const clickEvent = () => {
    console.log('clickEvent');
  };

  return (
    <StyledCard>
      <Title tag="h2" type={TextTypes.Heading4}>
        {t('login.title')}
      </Title>
      <StyledForm onSubmit={handleSubmit(onFormSubmit)}>
        <TextInput
            {...registerInput({
              register,
              name: 'email',
              options: { required: 'error.required' },
            })}
            id="email"
            label={t('login.email_label')}
            error={t(errors?.email?.message)}
            placeholder={t('login.email_placeholder')}
            type="email"
        />
        <TextInput
          {...registerInput({
            register,
            name: 'password',
            options: { required: 'error.required' },
          })}
          id="password"
          error={t(errors?.password?.message)}
          label={t('login.password_label')}
          placeholder={t('login.password_placeholder')}
          type="password"
        />
        <Link href={`/${FORGOT_PASSWORD_ROUTE}/`}>
          {t('login.forgot_password')}
        </Link>

        HI there?
      </StyledForm>
   </StyledCard>
  );
};

export default Login;
