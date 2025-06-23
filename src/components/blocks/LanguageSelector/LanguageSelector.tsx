import {
  Button,
} from '@a-little-world/little-world-design-system-native';

import { useTranslation } from 'react-i18next';
import i18next from '@/src/i18n'; // DON"T remove! impoant for translations to work!
import { useTheme } from 'styled-components/native';
import { StyleSheet, View } from 'react-native';

import { LANGUAGES } from '@/src/constants';
import { ButtonVariations } from '@a-little-world/little-world-design-system-core';

const getLanguageSelectorStyles = (theme: any) => StyleSheet.create({
  selector: {
    display: 'flex',
    alignItems: 'center',
  },
  languageButton: {
    fontWeight: 'bold',
    fontSize: 14, // 0.875rem equivalent
    lineHeight: 16, // 1rem equivalent
    backgroundColor: theme.color.surface.secondary, // fallback since disabled doesn't exist
    color: theme.color.border.subtle, // fallback since moderate doesn't exist
    textTransform: 'uppercase',
    padding: parseInt(theme.spacing.xxsmall, 10),
  },
  languageButtonDisabled: {
    backgroundColor: theme.color.surface.primary,
    color: theme.color.text.highlight,
  },
});

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const styles = getLanguageSelectorStyles(theme);

  const handleChangeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    //Cookies.set(COOKIE_LANG, lang);
  };

  return (
    <View style={styles.selector}>
      <Button
        aria-label="switch language to German"
        variation={ButtonVariations.Inline}
        onPress={() => handleChangeLanguage(LANGUAGES.de)}
        disabled={i18n.language === LANGUAGES.de}
        style={[
          styles.languageButton,
          i18n.language === LANGUAGES.de && styles.languageButtonDisabled
        ]}
      >
        DE
      </Button>
      <Button
        aria-label="switch language to English"
        variation={ButtonVariations.Inline}
        onPress={() => handleChangeLanguage(LANGUAGES.en)}
        style={[
          styles.languageButton,
          // i18n.language.includes(LANGUAGES.en) && styles.languageButtonDisabled
        ]}
      >
        EN
      </Button>
    </View>
  );
};

export default LanguageSelector;
