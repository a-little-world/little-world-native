import {
  ButtonAppearance,
  ButtonSizes,
  TextTypes,
} from '@a-little-world/little-world-design-system-core';
import {
  Card,
  Link,
  TextInput,
} from '@a-little-world/little-world-design-system-native';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { login } from '@/src/api';
import { onFormError } from '@/src/utils/form';

import {
  BASE_ROUTE,
  FORGOT_PASSWORD_ROUTE,
  SIGN_UP_ROUTE,
  USER_FORM_ROUTE,
  VERIFY_EMAIL_ROUTE,
} from '@/src/routes';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from 'styled-components/native';
import { StyledCta, StyledForm, Title } from './shared.styles';

function Login() {
  const { t } = useTranslation();
  const searchParams = useLocalSearchParams();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useTheme();
  const {
    handleSubmit,
    getValues,
    formState: { errors },
    setError,
    setFocus,
    control,
  } = useForm({ shouldUnregister: true });

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onError = (e) => {
    setIsSubmitting(false);
    onFormError({ e, formFields: getValues(), setError });
  };

  const onFormSubmit = async (data) => {
    setIsSubmitting(true);
    console.log('onFormSubmit', getValues());
    console.log(data);

    login(data)
      .then((loginData) => {
        //dispatch(initialise(loginData));
        setIsSubmitting(false);

        // passAuthenticationBoundary(); TODO

        if (!loginData.user.emailVerified) {
          router.navigate(VERIFY_EMAIL_ROUTE);
        } else if (!loginData.user.userFormCompleted) {
          router.navigate(USER_FORM_ROUTE);
        } else if (/*searchParams.get('next')*/ false) {
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
          router.navigate(BASE_ROUTE);
        }
      })
      .catch(onError);
  };

  return (
    <Card>
      <Title tag="h2" type={TextTypes.Heading4}>
        {t("login.title")}
      </Title>
      <StyledForm>
        <Controller
          control={control}
          name="email"
          rules={{ required: "Email is required" }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder={t("login.email_placeholder")}
              id="email"
              label={t("login.email_label")}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          rules={{ required: "Password is required" }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder={t("login.password_placeholder")}
              id="password"
              label={t("login.password_label")}
              type="password"
            />
          )}
        />
        <Link href={`/${FORGOT_PASSWORD_ROUTE}/`}>
          {t("login.forgot_password")}
        </Link>
        <StyledCta
          type="submit"
          onPress={handleSubmit(onFormSubmit)}
          disabled={isSubmitting}
          loading={isSubmitting}
          size={ButtonSizes.Stretch}
        >
          {t("login.submit_btn")}
        </StyledCta>
        <Link
          href={`/${SIGN_UP_ROUTE}`}
          buttonAppearance={ButtonAppearance.Secondary}
          buttonSize={ButtonSizes.Stretch}
        >
          {t("login.change_location_cta")}
        </Link>
      </StyledForm>
    </Card>
  );
}

export default Login;
