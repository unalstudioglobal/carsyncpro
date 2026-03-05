const fs = require('fs');

// 1. Update Translations
const trPath = 'src/locales/tr/translation.json';
const enPath = 'src/locales/en/translation.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

trData.docs = {
    // Status
    "unlimited": "Süresiz",
    "expired": "Süresi Dolmuş",
    "days_left": "{{d}} gün kaldı",
    "valid": "Geçerli",

    // Types
    "t_license": "Ruhsat",
    "t_insurance": "Sigorta",
    "t_inspection": "Muayene",
    "t_other": "Diğer",

    // UI
    "title": "Dijital Torpido",
    "expiry": "Bitiş:",

    // Modal
    "add_title": "Yeni Belge Ekle",
    "m_type": "Belge Tipi",
    "m_title": "Başlık",
    "m_title_ph": "Örn: Trafik Sigortası",
    "m_expiry": "Bitiş Tarihi",
    "m_notes": "Notlar",
    "m_notes_ph": "Poliçe no, detaylar...",

    "m_cancel": "İptal",
    "m_saving": "Kaydediliyor...",
    "m_save": "Kaydet"
};

enData.docs = {
    "unlimited": "Unlimited",
    "expired": "Expired",
    "days_left": "{{d}} days left",
    "valid": "Valid",

    "t_license": "License",
    "t_insurance": "Insurance",
    "t_inspection": "Inspection",
    "t_other": "Other",

    "title": "Digital Glovebox",
    "expiry": "Expiry:",

    "add_title": "Add New Document",
    "m_type": "Document Type",
    "m_title": "Title",
    "m_title_ph": "Ex: Traffic Insurance",
    "m_expiry": "Expiry Date",
    "m_notes": "Notes",
    "m_notes_ph": "Policy num, details...",

    "m_cancel": "Cancel",
    "m_saving": "Saving...",
    "m_save": "Save"
};

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

// 2. Update Documents.tsx
let content = fs.readFileSync('pages/Documents.tsx', 'utf8');

if (!content.includes('useTranslation')) {
    content = content.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}

// Ensure 't' is passed to functions or used directly
content = content.replace(
    "export const Documents: React.FC = () => {\n  const navigate = useNavigate();",
    "export const Documents: React.FC = () => {\n  const navigate = useNavigate();\n  const { t } = useTranslation();"
);

// getExpiryStatus
const oldStatusFn = `  const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return { color: 'text-slate-500', bg: 'bg-slate-100', text: 'Süresiz' };
    const days = differenceInDays(new Date(dateStr), new Date());
    if (days < 0) return { color: 'text-red-600', bg: 'bg-red-100', text: 'Süresi Dolmuş' };
    if (days < 30) return { color: 'text-amber-600', bg: 'bg-amber-100', text: \`\${days} gün kaldı\` };
    return { color: 'text-emerald-600', bg: 'bg-emerald-100', text: 'Geçerli' };
  };`;

const newStatusFn = `  const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return { color: 'text-slate-500', bg: 'bg-slate-100', text: t('docs.unlimited') };
    const days = differenceInDays(new Date(dateStr), new Date());
    if (days < 0) return { color: 'text-red-600', bg: 'bg-red-100', text: t('docs.expired') };
    if (days < 30) return { color: 'text-amber-600', bg: 'bg-amber-100', text: t('docs.days_left', { d: days }) };
    return { color: 'text-emerald-600', bg: 'bg-emerald-100', text: t('docs.valid') };
  };`;
content = content.replace(oldStatusFn, newStatusFn);

// Other
content = content.replace(">Dijital Torpido</h1>", ">{t('docs.title')}</h1>");
content = content.replace("doc.type === 'License' ? 'Ruhsat' : doc.type === 'Insurance' ? 'Sigorta' : 'Diğer'", "doc.type === 'License' ? t('docs.t_license') : doc.type === 'Insurance' ? t('docs.t_insurance') : t('docs.t_other')");

// locale for date formatter
content = content.replace("locale: tr", "locale: t('common.locale', { defaultValue: 'tr' }) === 'tr' ? tr : undefined");

content = content.replace(">Bitiş: ", ">{t('docs.expiry')} ");
content = content.replace(">Yeni Belge Ekle</h2>", ">{t('docs.add_title')}</h2>");
content = content.replace(">Belge Tipi</label>", ">{t('docs.m_type')}</label>");
content = content.replace("type === 'License' ? 'Ruhsat' : type === 'Insurance' ? 'Sigorta' : 'Muayene'", "type === 'License' ? t('docs.t_license') : type === 'Insurance' ? t('docs.t_insurance') : t('docs.t_inspection')");

content = content.replace(">Başlık</label>", ">{t('docs.m_title')}</label>");
content = content.replace("placeholder=\"Örn: Trafik Sigortası\"", "placeholder={t('docs.m_title_ph')}");

content = content.replace(">Bitiş Tarihi</label>", ">{t('docs.m_expiry')}</label>");

content = content.replace(">Notlar</label>", ">{t('docs.m_notes')}</label>");
content = content.replace("placeholder=\"Poliçe no, detaylar...\"", "placeholder={t('docs.m_notes_ph')}");

content = content.replace(">\n                        İptal\n                    </button>", ">\n                        {t('docs.m_cancel')}\n                    </button>");
content = content.replace("{loading ? 'Kaydediliyor...' : 'Kaydet'}", "{loading ? t('docs.m_saving') : t('docs.m_save')}");

fs.writeFileSync('pages/Documents.tsx', content);
console.log('Documents translated!');
