const fs = require('fs');

// 1. Update Translations
const trPath = 'src/locales/tr/translation.json';
const enPath = 'src/locales/en/translation.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

trData.car_chat = {
    "not_found": "Araç bulunamadı.",
    "mic_error": "Mikrofona erişilemedi. İzinleri kontrol edin.",
    "voice_msg": "🎤 Sesli Mesaj",
    "confirm_clear": "Sohbet geçmişini silmek istiyor musun?",
    "ai": "Yapay Zeka",
    "encryption_note": "Konuşma uçtan uca şifrelenmiştir. Araba sır tutar. 🤫",
    "recording": "Kaydediliyor...",
    "release_to_send": "Göndermek için parmağınızı çekin",
    "listening": "Dinleniyor...",
    "chat_ph": "{{model}} ile konuş...",
    "greeting_maint": "Öhöm... {{mileage}} kilometredir kahrını çekiyorum. Sanırım bir servise gitsek iyi olur, ne dersin? 🤒",
    "greeting_ok": "Selam patron! Depom dolu, motorum soğuk. Bugün nereye gazlıyoruz? 🏎️💨"
};

enData.car_chat = {
    "not_found": "Vehicle not found.",
    "mic_error": "Could not access microphone. Check permissions.",
    "voice_msg": "🎤 Voice Message",
    "confirm_clear": "Do you want to clear the chat history?",
    "ai": "AI",
    "encryption_note": "Chat is end-to-end encrypted. Your car keeps secrets. 🤫",
    "recording": "Recording...",
    "release_to_send": "Release finger to send",
    "listening": "Listening...",
    "chat_ph": "Talk to {{model}}...",
    "greeting_maint": "Ahem... I've been carrying your weight for {{mileage}} kilometers. I think it's time for a service, what do you say? 🤒",
    "greeting_ok": "Hello boss! Tank is full, engine is cold. Where are we flooring it today? 🏎️💨"
};

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

// 2. Update CarChat.tsx
let content = fs.readFileSync('pages/CarChat.tsx', 'utf8');

if (!content.includes('useTranslation')) {
    content = content.replace(
        "import { useLocation, useNavigate, useParams } from 'react-router-dom';",
        "import { useLocation, useNavigate, useParams } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}
if (!content.includes('const { t } = useTranslation()')) {
    content = content.replace(
        "const scrollRef = useRef<HTMLDivElement>(null);",
        "const scrollRef = useRef<HTMLDivElement>(null);\n  const { t, i18n } = useTranslation();"
    );
}

// Utterance lang
content = content.replace(
    "utterance.lang = 'tr-TR';",
    "utterance.lang = i18n.language === 'en' ? 'en-US' : 'tr-TR';"
);

const replacements = [
    ["'Araç bulunamadı.'", "t('car_chat.not_found')"],
    ["\"Mikrofona erişilemedi. İzinleri kontrol edin.\"", "t('car_chat.mic_error')"],
    ["'🎤 Sesli Mesaj'", "t('car_chat.voice_msg')"],
    ["'Sohbet geçmişini silmek istiyor musun?'", "t('car_chat.confirm_clear')"],
    [">Yapay Zeka<", ">{t('car_chat.ai')}<"],
    [">Konuşma uçtan uca şifrelenmiştir. Araba sır tutar. 🤫<", ">{t('car_chat.encryption_note')}<"],
    [">Kaydediliyor...<", ">{t('car_chat.recording')}<"],
    [">Göndermek için parmağınızı çekin<", ">{t('car_chat.release_to_send')}<"],
    ["isRecording ? 'Dinleniyor...' : `${vehicle.model} ile konuş...`", "isRecording ? t('car_chat.listening') : t('car_chat.chat_ph', { model: vehicle.model })"],
    ["`Öhöm... ${vehicle.mileage} kilometredir kahrını çekiyorum. Sanırım bir servise gitsek iyi olur, ne dersin? 🤒`", "t('car_chat.greeting_maint', { mileage: vehicle.mileage.toLocaleString() })"],
    ["`Selam patron! Depom dolu, motorum soğuk. Bugün nereye gazlıyoruz? 🏎️💨`", "t('car_chat.greeting_ok')"],
    [">Araç bulunamadı.</div>", ">{t('car_chat.not_found')}</div>"]
];

for (const [s, r] of replacements) {
    if (content.includes(s)) {
        content = content.split(s).join(r);
    }
}

fs.writeFileSync('pages/CarChat.tsx', content);
console.log('CarChat translated!');
