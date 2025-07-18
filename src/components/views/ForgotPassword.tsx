import {
  Button,
  Text,
  TextInput,
} from '@a-little-world/little-world-design-system-native';

import { TextTypes } from '@a-little-world/little-world-design-system-core';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components/native';

import { LOGIN_ROUTE } from '@/src/routes';
import { onFormError } from '@/src/utils/form';
import { useRouter } from 'expo-router';
import { requestPasswordReset } from '../../api';
import ButtonsContainer from '../atoms/ButtonsContainer';
import { StyledCard, StyledForm, Title } from './shared.styles';

export const ForgotPasswordDescription = styled(Text)`
  margin-bottom: ${({ theme }) => theme.spacing.medium};
`;

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSuccessful, setRequestSuccessful] = useState(false);
  const theme = useTheme();

  const {
    handleSubmit,
    getValues,
    formState: { errors },
    setError,
    setFocus,
    control,
  } = useForm({ shouldUnregister: true });

  const router = useRouter();

  const onError = (e) => {
    onFormError({ e, formFields: getValues(), setError });
    setIsSubmitting(false);
  };

  const onFormSubmit = async (data) => {
    setIsSubmitting(true);
    console.log(data);

    requestPasswordReset(data)
      .then(() => {
        setRequestSuccessful(true);
        setIsSubmitting(false);
      })
      .catch(onError);
  };

  return (
    <StyledCard>
      <Title tag="h2" type={TextTypes.Heading4}>
        {t('forgot_password.title')}
      </Title>
      <ForgotPasswordDescription>
        {t('forgot_password.description')}
      </ForgotPasswordDescription>
      <StyledForm onSubmit={handleSubmit(onFormSubmit)}>
        <Controller
          control={control}
          name="email"
          rules={{ required: 'Email is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              id="email"
              label={t('forgot_password.email_label')}
              error={t(errors?.email?.message)}
              placeholder={t('forgot_password.email_placeholder')}
              type="email"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />

        {/* <StatusMessage
          $visible={requestSuccessful || errors?.root?.serverError}
          $type={requestSuccessful ? MessageTypes.Success : MessageTypes.Error}
        >
          {requestSuccessful
            ? t("forgot_password.success_message")
            : t(errors?.root?.serverError?.message)}
        </StatusMessage> */}
        <ButtonsContainer>
          <Button
            // appearance={ButtonAppearance.Secondary}
            onPress={() => router.navigate(LOGIN_ROUTE)}
            color={theme.color.text.link}
          >
            {t('forgot_password.cancel_btn')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            onPress={handleSubmit(onFormSubmit)}
          >
            {t('forgot_password.submit_btn')}
          </Button>
        </ButtonsContainer>
      </StyledForm>
    </StyledCard>
  );
};

export default ForgotPassword;
