// @ts-nocheck
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from '@a-little-world/little-world-frontend-shared';

import { LANGUAGES } from './constants';
import translationDE from './locale/de.json';
import translationEN from './locale/en.json';


/*
I'm overwriting the seperators here since the backend also uses '.' in the translations!
*/
i18next
  .use(initReactI18next)
  .init({
    nsSeparator: ':::',
    keySeparator: '::',
    resources: {
      en: {
        translation: {
          ...translations.en, // Shared translations first (base)
          ...translationEN, // Local translations override shared ones
        },
      },
      de: {
        translation: {
          ...translations.de, // Shared translations first (base)
          ...translationDE, // Local translations override shared ones
        },
      },
    },
    languages: [LANGUAGES.en, LANGUAGES.de],
    fallbackLng: LANGUAGES.de,
  });

// eslint-disable-next-line import/prefer-default-export
export const updateTranslationResources = ({ apiTranslations }: { apiTranslations: any }) => {
  /*
  This upates the current translations resources with all backend translations!
  */
  console.log('INJECTED BACKEND TRANSLATIONS', apiTranslations);
  Object.keys(apiTranslations).forEach(lang => {
    i18next.addResourceBundle(lang, 'translation', {
      ...i18next.getResourceBundle(lang, 'translation'),
      ...apiTranslations[lang],
    });
  });
};

export default i18next;