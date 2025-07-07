import {
    Link,
    TextInput,
    Button,
    Card,
    Text,
} from "@a-little-world/little-world-design-system-native";
import {
    ButtonAppearance,
    ButtonVariations,
    ButtonSizes,
    StatusTypes,
    TextBaseProps,
    TextTypes,
} from "@a-little-world/little-world-design-system-core";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import i18next from "@/src/i18n"; // DON"T remove! impoant for translations to work!
import { useTranslation } from "react-i18next";

import { login } from "@/src/api";
import { onFormError, registerInput } from "@/src/utils/form";

import { FORGOT_PASSWORD_ROUTE, SIGN_UP_ROUTE, LOGIN_ROUTE } from "@/src/routes";
import { StyledCta, StyledForm, Title } from "./shared.styles";

import { useTheme } from "styled-components/native";
import { View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";



const ForgotPassword = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigation = useNavigation();
    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
        setError,
        setFocus,
    } = useForm({ shouldUnregister: true });

    useEffect(() => {
        setFocus("email");
    }, [setFocus]);

    const onError = (e: any) => {
        setIsSubmitting(false);
        onFormError({ e, formFields: getValues(), setError });
    };

    const onFormSubmit = async (data) => {
        setIsSubmitting(true);

        login(data)
            .then((loginData) => {
                //dispatch(initialise(loginData));
                setIsSubmitting(false);

                //passAuthenticationBoundary(); TODO

                if (!loginData.user.emailVerified) {
                    //navigate(getAppRoute(VERIFY_EMAIL_ROUTE)); TODO
                } else if (!loginData.user.userFormCompleted) {
                    //navigate(getAppRoute(USER_FORM_ROUTE)); TODO
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
                    //navigate(getAppRoute()); TODO
                }
            })
            .catch(onError);
    };

    const [isActive, setIsActive] = useState(false);

    const clickEvent = () => {
        console.log("clickEvent");
    };
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            backgroundColor: '#fff',
            paddingHorizontal: 20,
            paddingVertical: 16,
        },
        inputField: {
            paddingVertical: 16,
            marginBottom: 8,
        },
        link: {
            paddingVertical: 16,
        },
        button: {
            width: '50%',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },
        title: {
            fontSize: 32,
            marginBottom: 40,
            fontWeight: 'bold',
            color: 'black',
        },
        text: {
            marginBottom: 16
        },
        buttons: {
            marginTop: 16,
            flexDirection: "row",
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 8,
        },

    });
    return (
        <View style={styles.container}>
            <Card>
                <Title tag="h2" type={TextTypes.Heading4} style={styles.title}>
                    {t("forgot_password.title")}
                </Title>
                <StyledForm onSubmit={handleSubmit(onFormSubmit)}>
                    <Text children={t("forgot_password.description")}
                        style={styles.text}>

                    </Text>
                    <TextInput style={styles.inputField}
                        {...registerInput({
                            register,
                            name: "email",
                            options: { required: "error.required" },
                        })}
                        id="email"
                        label={t("forgot_password.email_label")}
                        error={t(errors?.email?.message)}
                        placeholder={t("forgot_password.email_placeholder")}
                        labelTooltip="test"
                        type="text"
                    />
                    <View style={styles.buttons}>
                        <Link style={styles.button}
                            onClick={() => navigation.goBack()}
                            buttonAppearance={ButtonAppearance.Secondary}
                            buttonSize={ButtonSizes.Stretch}
                        >
                            {t("forgot_password.cancel_btn")}
                        </Link>
                        <StyledCta
                            style={styles.button}
                            type="submit"
                            onClick={clickEvent}
                            disabled={isSubmitting}
                            loading={isSubmitting}
                            size={ButtonSizes.Stretch}
                        >
                            {t("forgot_password.submit_btn")}
                        </StyledCta>
                    </View>
                </StyledForm>
            </Card>
        </View>
    );
};

export default ForgotPassword;

