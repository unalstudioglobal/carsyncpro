const fs = require('fs');

// 1. Update Translations
const trPath = 'src/locales/tr/translation.json';
const enPath = 'src/locales/en/translation.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

trData.add_record = {
    "tour_quick_title": "Hızlı İşlem Seçimi",
    "tour_quick_desc": "Yapılan işlemi yukarıdaki yatay menüden hızlıca seçebilir veya listeden özelleştirebilirsiniz.",
    "tour_ai_title": "Yapay Zeka ile Tarama",
    "tour_ai_desc": "Servis fişinin veya faturasının fotoğrafını çekin; yapay zeka tutarı ve tarihi otomatik doldursun.",
    "tour_remind_title": "Otomatik Hatırlatıcı",
    "tour_remind_desc": "İşlemi kaydettiğinizde, bir sonraki bakım zamanı için otomatik bir hatırlatıcı oluşturulur.",

    "ai_success": "✨ Fatura detayları YZ tarafından otomatik dolduruldu!",
    "ai_error": "Görüntü analiz edilemedi.",
    "err_req": "Lütfen en az kilometre veya maliyet giriniz.",
    "success_save": "Kayıt başarıyla eklendi!",
    "err_save": "Kayıt eklenirken bir hata oluştu. Tekrar deneyin.",

    "cancel": "İptal",
    "title": "Kayıt Ekle",
    "saving": "Kaydediliyor...",
    "save": "Kaydet",

    "service_type": "SERVİS TÜRÜ",
    "action_fuel": "Yakıt",
    "action_oil": "Yağ",
    "action_maint": "Bakım",
    "action_tire": "Lastik",
    "action_rotation": "Rotasyon",
    "action_inspection": "Muayene",
    "action_battery": "Akü",
    "action_wash": "Yıkama",

    "type_fuel": "Yakıt Alımı",
    "type_oil": "Yağ Değişimi",
    "type_maint": "Periyodik Bakım",
    "type_tire": "Lastik Değişimi",
    "type_rotation": "Lastik Rotasyonu",
    "type_brake": "Fren Servisi",
    "type_battery": "Akü Değişimi",
    "type_inspection": "Muayene",
    "type_wash": "Yıkama & Detay",
    "type_other": "Diğer",

    "odometer": "KİLOMETRE SAYACI",
    "odometer_ph": "Mevcut km",
    "km": "km",

    "date": "SERVİS TARİHİ",

    "cost": "TOPLAM MALİYET",

    "notes": "NOTLAR (İSTEĞE BAĞLI)",
    "notes_ph": "Kullanılan parçalar, markalar veya özel bulgular hakkında detay ekleyin...",

    "upload_title": "FATURA/FOTOĞRAF YÜKLE",
    "upload_ai_loading": "Yapay Zeka Analiz Ediyor...",
    "upload_btn": "Fatura veya Fiş Yükle",
    "upload_ai_desc": "YZ ile otomatik veri doldurma",
    "upload_remove": "Kaldır",
    "analyzing": "Analiz Ediliyor...",

    "payment_title": "Ödeme Durumu",
    "payment_desc": "Bu işlem için ödeme yapıldı mı?",
    "pay_card": "Kredi Kartı",
    "pay_cash": "Nakit",
    "pay_other": "Diğer",
    "pay_credit_card": "Credit Card",

    "reminder_title": "Hatırlatıcı Kur",
    "reminder_desc": "Bir sonraki servis için beni uyar",
    "reminder_info": "Hatırlatıcı, genel servis aralıklarına (+5.000 km veya 6 ay) göre ayarlanacaktır.",
    "reminder_custom": "Özel",
    "reminder_ph": "Örn: 7500",
    "reminder_suffix": "km sonra",
    "reminder_note": "Otomatik hatırlatıcı: +{{km}} km veya 6 ay sonra."
};

enData.add_record = {
    "tour_quick_title": "Quick Action Selection",
    "tour_quick_desc": "You can quickly select the action from the horizontal menu or customize it from the list.",
    "tour_ai_title": "AI Scanning",
    "tour_ai_desc": "Take a photo of the receipt or invoice; AI will automatically fill in the amount and date.",
    "tour_remind_title": "Auto Reminder",
    "tour_remind_desc": "When you save the record, an automatic reminder is created for the next maintenance.",

    "ai_success": "✨ Invoice details auto-filled by AI!",
    "ai_error": "Could not analyze the image.",
    "err_req": "Please enter at least mileage or cost.",
    "success_save": "Record added successfully!",
    "err_save": "An error occurred while adding the record. Please try again.",

    "cancel": "Cancel",
    "title": "Add Record",
    "saving": "Saving...",
    "save": "Save",

    "service_type": "SERVICE TYPE",
    "action_fuel": "Fuel",
    "action_油": "Oil",
    "action_oil": "Oil",
    "action_maint": "Maintenance",
    "action_tire": "Tires",
    "action_rotation": "Rotation",
    "action_inspection": "Inspection",
    "action_battery": "Battery",
    "action_wash": "Wash",

    "type_fuel": "Fuel Purchase",
    "type_oil": "Oil Change",
    "type_maint": "Periodic Maintenance",
    "type_tire": "Tire Replacement",
    "type_rotation": "Tire Rotation",
    "type_brake": "Brake Service",
    "type_battery": "Battery Replacement",
    "type_inspection": "Inspection",
    "type_wash": "Wash & Detail",
    "type_other": "Other",

    "odometer": "ODOMETER",
    "odometer_ph": "Current mileage",
    "km": "km",

    "date": "SERVICE DATE",

    "cost": "TOTAL COST",

    "notes": "NOTES (OPTIONAL)",
    "notes_ph": "Add details about parts used, brands, or special findings...",

    "upload_title": "UPLOAD INVOICE/PHOTO",
    "upload_ai_loading": "AI is Analyzing...",
    "upload_btn": "Upload Invoice or Receipt",
    "upload_ai_desc": "Auto data fill with AI",
    "upload_remove": "Remove",
    "analyzing": "Analyzing...",

    "payment_title": "Payment Status",
    "payment_desc": "Was this service paid for?",
    "pay_card": "Credit Card",
    "pay_cash": "Cash",
    "pay_other": "Other",
    "pay_credit_card": "Credit Card",

    "reminder_title": "Set Reminder",
    "reminder_desc": "Notify me for the next service",
    "reminder_info": "Reminder will be set according to general service intervals (+5,000 km or 6 months).",
    "reminder_custom": "Custom",
    "reminder_ph": "e.g. 7500",
    "reminder_suffix": "km from now",
    "reminder_note": "Auto reminder: in +{{km}} km or 6 months."
};

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

// 2. Update AddRecord.tsx
let content = fs.readFileSync('pages/AddRecord.tsx', 'utf8');

if (!content.includes('useTranslation')) {
    content = content.replace(
        "import { useNavigate, useLocation } from 'react-router-dom';",
        "import { useNavigate, useLocation } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
    content = content.replace(
        "const location = useLocation();",
        "const location = useLocation();\n  const { t, i18n } = useTranslation();"
    );
}

// Locale logic for DatePicker
content = content.replace(
    "import { tr } from 'date-fns/locale';",
    "import { tr, enUS } from 'date-fns/locale';"
);
if (!content.includes('const dateLocale = ')) {
    content = content.replace(
        "const [isCalendarOpen, setIsCalendarOpen] = useState(false);",
        "const [isCalendarOpen, setIsCalendarOpen] = useState(false);\n  const dateLocale = i18n.language === 'en' ? enUS : tr;"
    );
}
// Replace { locale: tr } with { locale: dateLocale }
content = content.replace(/{ locale: tr }/g, "{ locale: dateLocale }");
content = content.replace(/locale={tr}/g, "locale={dateLocale}");

const replacements = [
    // Onboarding 
    ["'Hızlı İşlem Seçimi'", "t('add_record.tour_quick_title')"],
    ["'Yapılan işlemi yukarıdaki yatay menüden hızlıca seçebilir veya listeden özelleştirebilirsiniz.'", "t('add_record.tour_quick_desc')"],
    ["'Yapay Zeka ile Tarama'", "t('add_record.tour_ai_title')"],
    ["'Servis fişinin veya faturasının fotoğrafını çekin; yapay zeka tutarı ve tarihi otomatik doldursun.'", "t('add_record.tour_ai_desc')"],
    ["'Otomatik Hatırlatıcı'", "t('add_record.tour_remind_title')"],
    ["'İşlemi kaydettiğinizde, bir sonraki bakım zamanı için otomatik bir hatırlatıcı oluşturulur.'", "t('add_record.tour_remind_desc')"],

    // Actions map
    ["label: 'Yakıt'", "label: t('add_record.action_fuel')"],
    ["label: 'Yağ'", "label: t('add_record.action_oil')"],
    ["label: 'Bakım'", "label: t('add_record.action_maint')"],
    ["label: 'Lastik'", "label: t('add_record.action_tire')"],
    ["label: 'Rotasyon'", "label: t('add_record.action_rotation')"],
    ["label: 'Muayene'", "label: t('add_record.action_inspection')"],
    ["label: 'Akü'", "label: t('add_record.action_battery')"],
    ["label: 'Yıkama'", "label: t('add_record.action_wash')"],

    // Toasts
    ["toast.success('✨ Fatura detayları YZ tarafından otomatik dolduruldu!')", "toast.success(t('add_record.ai_success'))"],
    ["toast.error(data.error || 'Görüntü analiz edilemedi.')", "toast.error(data.error || t('add_record.ai_error'))"],
    ["toast.error('Lütfen en az kilometre veya maliyet giriniz.')", "toast.error(t('add_record.err_req'))"],
    ["toast.success('Kayıt başarıyla eklendi!')", "toast.success(t('add_record.success_save'))"],
    ["toast.error('Kayıt eklenirken bir hata oluştu. Tekrar deneyin.')", "toast.error(t('add_record.err_save'))"],

    // Notes
    ["\`Otomatik hatırlatıcı: +${formData.reminderKm} km veya 6 ay sonra.\`", "t('add_record.reminder_note', { km: formData.reminderKm })"],

    // UI Buttons and text
    [">İptal<", ">{t('add_record.cancel')}<"],
    [">Kayıt Ekle<", ">{t('add_record.title')}<"],
    ["{saving ? 'Kaydediliyor...' : 'Kaydet'}", "{saving ? t('add_record.saving') : t('add_record.save')}"],

    [">SERVİS TÜRÜ<", ">{t('add_record.service_type')}<"],

    // Service Type Map for DB
    // I will replace the <option> strings to use translation
    [">Yağ Değişimi</option>", ">{t('add_record.type_oil')}</option>"],
    [">Yakıt Alımı</option>", ">{t('add_record.type_fuel')}</option>"],
    [">Periyodik Bakım</option>", ">{t('add_record.type_maint')}</option>"],
    [">Lastik Değişimi</option>", ">{t('add_record.type_tire')}</option>"],
    [">Lastik Rotasyonu</option>", ">{t('add_record.type_rotation')}</option>"],
    [">Fren Servisi</option>", ">{t('add_record.type_brake')}</option>"],
    [">Akü Değişimi</option>", ">{t('add_record.type_battery')}</option>"],
    [">Muayene</option>", ">{t('add_record.type_inspection')}</option>"],
    [">Yıkama & Detay</option>", ">{t('add_record.type_wash')}</option>"],
    // wait I missed "Diğer". It's `<option value="Diğer">Diğer</option>`
    ["<option value=\"Diğer\">Diğer</option>", "<option value=\"Diğer\">{t('add_record.type_other')}</option>"],

    [">KİLOMETRE SAYACI<", ">{t('add_record.odometer')}<"],
    ["placeholder=\"Mevcut km\"", "placeholder={t('add_record.odometer_ph')}"],
    [">km</span>", ">{t('add_record.km')}</span>"],

    [">SERVİS TARİHİ<", ">{t('add_record.date')}<"],
    [">TOPLAM MALİYET<", ">{t('add_record.cost')}<"],

    [">NOTLAR (İSTEĞE BAĞLI)<", ">{t('add_record.notes')}<"],
    ["placeholder=\"Kullanılan parçalar, markalar veya özel bulgular hakkında detay ekleyin...\"", "placeholder={t('add_record.notes_ph')}"],

    [">FATURA/FOTOĞRAF YÜKLE<", ">{t('add_record.upload_title')}<"],
    [">Yapay Zeka Analiz Ediyor...<", ">{t('add_record.upload_ai_loading')}<"],
    [">Fatura veya Fiş Yükle<", ">{t('add_record.upload_btn')}<"],
    [">YZ ile otomatik veri doldurma<", ">{t('add_record.upload_ai_desc')}<"],
    [">Kaldır<", ">{t('add_record.upload_remove')}<"],
    [">Analiz Ediliyor...<", ">{t('add_record.analyzing')}<"],

    [">Ödeme Durumu<", ">{t('add_record.payment_title')}<"],
    [">Bu işlem için ödeme yapıldı mı?<", ">{t('add_record.payment_desc')}<"],
    ["{method === 'Credit Card' ? 'Kredi Kartı' : method === 'Cash' ? 'Nakit' : 'Diğer'}", "{method === 'Credit Card' ? t('add_record.pay_card') : method === 'Cash' ? t('add_record.pay_cash') : t('add_record.pay_other')}"],

    [">Hatırlatıcı Kur<", ">{t('add_record.reminder_title')}<"],
    [">Bir sonraki servis için beni uyar<", ">{t('add_record.reminder_desc')}<"],
    [">Hatırlatıcı, genel servis aralıklarına (+5.000 km veya 6 ay) göre ayarlanacaktır.<", ">{t('add_record.reminder_info')}<"],
    [">Özel<", ">{t('add_record.reminder_custom')}<"],
    ["placeholder=\"Örn: 7500\"", "placeholder={t('add_record.reminder_ph')}"],
    [">km sonra<", ">{t('add_record.reminder_suffix')}<"]
];

for (const [s, r] of replacements) {
    if (content.includes(s)) {
        content = content.split(s).join(r);
    }
}

fs.writeFileSync('pages/AddRecord.tsx', content);
console.log('AddRecord translated!');
