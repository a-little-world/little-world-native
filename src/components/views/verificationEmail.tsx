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

import { FORGOT_PASSWORD_ROUTE, SIGN_UP_ROUTE, LOGIN_ROUTE, VERIFY_EMAIL_ROUTE, RESET_PASSWORD_ROUTE } from "@/src/routes";
import { StyledCta, StyledForm, Title } from "./shared.styles";

import { useTheme } from "styled-components/native";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import RenderHTML from "react-native-render-html";



const VerifyEmail = () => {
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

    const [isActive, setIsActive] = useState(false);
    const { width } = useWindowDimensions();
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
                    {t("verify_email.title")}
                </Title>
                <Text children={t("verify_email.description")}
                    style={styles.text}>
                </Text>

                <TextInput style={styles.inputField}
                    id="email"
                    label={t("verify_email.input_label")}
                    placeholder={t("verify_email.code_placeholder")}
                    labelTooltip="code"
                    type="tel"
                />
                <Link style={[]}
                    onClick={() => navigation.navigate(VERIFY_EMAIL_ROUTE as never)}
                >
                    {t("verify_email.resend_code")}
                </Link>
                <Text children={t("verify_email.help_text")}></Text>

                <View style={styles.buttons}>
                    <StyledCta
                        style={styles.button}
                        type="submit"
                        onPress={() => navigation.navigate(RESET_PASSWORD_ROUTE as never)}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        size={ButtonSizes.Stretch}
                    >
                        {t("verify_email.submit_btn")}
                    </StyledCta>
                    <Link style={styles.button}
                        onClick={() => navigation.goBack()}
                        buttonAppearance={ButtonAppearance.Secondary}
                        buttonSize={ButtonSizes.Stretch}
                    >
                        {t("verify_email.change_email_btn")}
                    </Link>
                </View>
            </Card>
        </View>
    );
};

export default VerifyEmail;

