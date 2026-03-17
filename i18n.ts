import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Dil dosyalarını import ediyoruz
import translationTR from './src/locales/tr/translation.json';
import translationEN from './src/locales/en/translation.json';
import translationES from './src/locales/es/translation.json';

i18n
    // Dili tarayıcıdan, localStorage'dan vs algıla
    .use(LanguageDetector)
    // i18n'i React'e bağla
    .use(initReactI18next)
    .init({
        resources: {
            tr: { translation: translationTR },
            en: { translation: translationEN },
            es: { translation: translationES },
        },
        // fallbackLng: Tarayıcının dili bulunamazsa kullanılacak dil
        fallbackLng: 'tr',

        debug: false,

        interpolation: {
            escapeValue: false // React zaten XSS koruması yapar
        }
    });

export default i18n;
