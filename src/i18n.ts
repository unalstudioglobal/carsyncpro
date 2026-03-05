import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Türkçe Çeviriler
import trTranslation from './locales/tr/translation.json';
// İngilizce Çeviriler
import enTranslation from './locales/en/translation.json';

i18n
    // Dili tarayıcıdan, localStorage'dan vs algıla
    .use(LanguageDetector)
    // i18n'i React'e bağla
    .use(initReactI18next)
    .init({
        resources: {
            tr: { translation: trTranslation },
            en: { translation: enTranslation }
        },
        // fallbackLng: Tarayıcının dili bulunamazsa kullanılacak dil
        fallbackLng: 'tr',

        // Uygulama yüklendiğinde logları görmek istiyorsan 'true' yap
        debug: false,

        interpolation: {
            escapeValue: false // React zaten XSS koruması yapar
        }
    });

export default i18n;
