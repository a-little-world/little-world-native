import {
    Link,
    TextInput,
    Button,
    Card,
    Text,
    Checkbox,
    Label,
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

import { SIGN_UP_ROUTE, VERIFY_EMAIL_ROUTE } from "@/src/routes";
import { StyledCta, StyledForm, Title } from "./shared.styles";

import { useTheme } from "styled-components/native";
import { View, StyleSheet, ScrollView, useWindowDimensions, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import RenderHTML, { MixedStyleDeclaration } from 'react-native-render-html';

const SignUp = () => {
    // const dispatch = useDispatch();
    //const { t } = useTranslation();
    const { t } = useTranslation();
    // const [searchParams] = useSearchParams();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const theme = useTheme();
    const navigation = useNavigation();
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
    const { width } = useWindowDimensions();
    const clickEvent = () => {
        console.log("clickEvent");
    };
    const renderersProps = {
        a: {
            onPress: (_event: any, href: string) => Linking.openURL(href)
        },
    }
    const tagsStyles: Record<string, MixedStyleDeclaration> = {
        p: {
            justifyContent: 'flex-start',
        },
        a: {
            color: '#007AFF',
            textDecorationLine: 'underline',
        },
    }
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            backgroundColor: '#fff',
            paddingHorizontal: 20,
            paddingVertical: 16,
        },
        checkBoxRow: {
            flexDirection: "row",
            justifyContent: 'flex-start',
            alignItems: 'center',
        },
        checkBox: {

        },
        inputFieldSmall: {
            paddingVertical: 16,
            marginBottom: 8,
        },
        inputFieldSmall2: {
            width: '50%',
            alignContent: 'flex-end',
            paddingVertical: 16,
            marginBottom: 8,
        },
        inputField2: {
            paddingVertical: 16,
            marginBottom: 8,
        },
        link: {
            paddingVertical: 16,
        },
        button: {
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: 8,
        },
        button2: {

            marginBottom: 128,
        },
        title: {
            fontSize: 32,
            marginBottom: 40,
            fontWeight: '900',
            color: 'black',
        },
        doubleInput: {
            marginTop: 16,
            flexDirection: "row",
            justifyContent: 'space-between',

            gap: 8,
            paddingHorizontal: 8,
        },
        test: {
            width: '50%'
        },

    });
    return (
        <ScrollView >
            <Card>
                <Title tag="h1" type={TextTypes.Heading4} style={styles.title}>
                    {t("sign_up.title")}
                </Title>
                <StyledForm onSubmit={handleSubmit(onFormSubmit)}>

                    <View style={styles.doubleInput}>
                        <View style={styles.test}>
                            <TextInput style={styles.inputFieldSmall}

                                id="first_name"
                                label={t("sign_up.name_label")}
                                error={t(errors?.email?.message)}
                                placeholder={t("sign_up.first_name_placeholder")}
                                labelTooltip="test"
                                type="text"
                            />
                        </View>
                        <TextInput
                            style={styles.inputFieldSmall2}

                            label=" "
                            id="second_name"
                            error={t(errors?.password?.message)}
                            placeholder={t("sign_up.second_name_placeholder")}
                            type="text"
                        />
                    </View>
                    <TextInput
                        style={styles.inputField2}

                        id="e-mail"
                        error={t(errors?.password?.message)}
                        label={t("sign_up.email_label")}
                        placeholder={t("sign_up.email_placeholder")}
                        type="text"
                    />
                    <TextInput
                        style={styles.inputField2}

                        id="password"
                        error={t(errors?.password?.message)}
                        label={t("sign_up.password_label")}
                        placeholder={t("sign_up.password_placeholder")}
                        type="password"
                    />
                    <TextInput
                        style={styles.inputField2}

                        id="password"
                        error={t(errors?.password?.message)}
                        label={t("sign_up.confirm_password_label")}
                        type="password"
                    />
                    <TextInput
                        style={styles.inputFieldSmall2}

                        id="password"
                        error={t(errors?.password?.message)}
                        label={t("sign_up.birth_year_label")}
                        placeholder={t("sign_up.birth_year_placeholder")}
                        type="tel"
                    />
                    <Checkbox checked={false}
                        onCheckedChange={(value) => console.log({ checked: value })}
                        label={t("sign_up.mailing_list_label")}
                    />
                    <View style={styles.checkBoxRow}>
                        <Checkbox checked={false}
                            onCheckedChange={(value) => console.log({ checked: value })}
                        />
                        <RenderHTML
                            source={{ html: "<p>" + t("sign_up.terms_label") + "</p>" }}
                            tagsStyles={tagsStyles}
                            contentWidth={width}
                            renderersProps={renderersProps}
                        />
                    </View>
                    <RenderHTML
                        source={{ html: "<p>" + t("sign_up.privacy_policy") + "</p>" }}
                        tagsStyles={tagsStyles}
                        contentWidth={width}
                        renderersProps={renderersProps}
                    ></RenderHTML>

                    <StyledCta
                        style={styles.button}
                        type="submit"
                        onPress={() => navigation.navigate(VERIFY_EMAIL_ROUTE as never)}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        size={ButtonSizes.Stretch}
                    >
                        {t("sign_up.submit_btn")}
                    </StyledCta>

                    <Link style={[styles.button, styles.button2]}
                        onClick={() => navigation.navigate(VERIFY_EMAIL_ROUTE as never)}
                        buttonAppearance={ButtonAppearance.Secondary}
                        buttonSize={ButtonSizes.Stretch}
                    >
                        {t("sign_up.change_location_cta")}
                    </Link>
                </StyledForm>
            </Card>
        </ScrollView>
    );
};

export default SignUp;

/* How to use registerInput
{...registerInput({
    register,
    name: "password",
    options: { required: "error.required" },
})}*/