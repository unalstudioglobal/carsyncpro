const fs = require('fs');

// 1. Update Translations
const trPath = 'src/locales/tr/translation.json';
const enPath = 'src/locales/en/translation.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

trData.add_vehicle = {
    "title_add": "Yeni Araç Ekle",
    "title_edit": "Aracı Düzenle",
    "step": "Adım {{current}}/{{total}}",
    "brand": "MARKA",
    "brand_ph": "Örn. BMW, Toyota",
    "err_brand": "Lütfen aracın markasını giriniz.",
    "model": "MODEL",
    "model_ph": "Örn. 320i, Corolla",
    "err_model": "Lütfen aracın modelini giriniz.",
    "year": "YIL",
    "year_ph": "Örn. 2023",
    "err_year_format": "Yıl 4 haneli olmalıdır (Örn: 2020).",
    "err_year_range": "Yıl 1900 ile {{max}} arasında olmalıdır.",
    "plate": "PLAKA",
    "plate_ph": "Örn. 34ABC123",
    "err_plate_req": "Plaka alanı zorunludur.",
    "err_plate_format": "Geçerli bir Türk plakası giriniz. (Örn: 34ABC123 veya 34-ABC-123)",
    "mileage": "KİLOMETRE",
    "mileage_ph": "Örn. 45000",
    "err_mileage_req": "Kilometre alanı zorunludur.",
    "err_mileage_format": "Geçerli bir kilometre değeri giriniz.",
    "status": "ARAÇ DURUMU",
    "status_ok": "Sorun Yok",
    "status_maint": "Bakım Gerekli",
    "status_repair": "Onarımda",
    "photo": "ARAÇ FOTOĞRAFI",
    "photo_desc": "Fotoğraf yüklemek için dokunun (İsteğe Bağlı)",
    "uploading": "Yükleniyor...",
    "back": "Geri",
    "next": "İleri",
    "save": "Kaydet",
    "success_add": "Yeni araç garajınıza eklendi!",
    "success_edit": "Değişiklikler başarıyla kaydedildi!",
    "error_save": "Bir hata oluştu. Lütfen tekrar deneyin."
};

enData.add_vehicle = {
    "title_add": "Add New Vehicle",
    "title_edit": "Edit Vehicle",
    "step": "Step {{current}}/{{total}}",
    "brand": "BRAND",
    "brand_ph": "e.g. BMW, Toyota",
    "err_brand": "Please enter the vehicle brand.",
    "model": "MODEL",
    "model_ph": "e.g. 320i, Corolla",
    "err_model": "Please enter the vehicle model.",
    "year": "YEAR",
    "year_ph": "e.g. 2023",
    "err_year_format": "Year must be 4 digits (e.g. 2020).",
    "err_year_range": "Year must be between 1900 and {{max}}.",
    "plate": "LICENSE PLATE",
    "plate_ph": "e.g. 34ABC123",
    "err_plate_req": "License plate is required.",
    "err_plate_format": "Please enter a valid Turkish plate. (e.g. 34ABC123)",
    "mileage": "MILEAGE",
    "mileage_ph": "e.g. 45000",
    "err_mileage_req": "Mileage is required.",
    "err_mileage_format": "Please enter a valid mileage.",
    "status": "VEHICLE STATUS",
    "status_ok": "OK",
    "status_maint": "Needs Maintenance",
    "status_repair": "In Repair",
    "photo": "VEHICLE PHOTO",
    "photo_desc": "Tap to upload photo (Optional)",
    "uploading": "Uploading...",
    "back": "Back",
    "next": "Next",
    "save": "Save",
    "success_add": "New vehicle added to your garage!",
    "success_edit": "Changes saved successfully!",
    "error_save": "An error occurred. Please try again."
};

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

// 2. Update AddVehicle.tsx
let content = fs.readFileSync('pages/AddVehicle.tsx', 'utf8');

if (!content.includes('useTranslation')) {
    content = content.replace(
        "import { useNavigate, useLocation } from 'react-router-dom';",
        "import { useNavigate, useLocation } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
    content = content.replace(
        "const location = useLocation();",
        "const location = useLocation();\n  const { t } = useTranslation();"
    );
}

const replacements = [
    // Validation Errors
    ["'Lütfen aracın markasını giriniz.'", "t('add_vehicle.err_brand')"],
    ["'Lütfen aracın modelini giriniz.'", "t('add_vehicle.err_model')"],
    ["'Yıl 4 haneli olmalıdır (Örn: 2020).'", "t('add_vehicle.err_year_format')"],
    ["`Yıl 1900 ile ${currentYear + 1} arasında olmalıdır.`", "t('add_vehicle.err_year_range', { max: currentYear + 1 })"],
    ["'Plaka alanı zorunludur.'", "t('add_vehicle.err_plate_req')"],
    ["'Geçerli bir Türk plakası giriniz. (Örn: 34ABC123 veya 34-ABC-123)'", "t('add_vehicle.err_plate_format')"],
    ["'Kilometre alanı zorunludur.'", "t('add_vehicle.err_mileage_req')"],
    ["'Geçerli bir kilometre değeri giriniz.'", "t('add_vehicle.err_mileage_format')"],

    // Toasts
    ["toast.success(isEditMode ? 'Değişiklikler başarıyla kaydedildi!' : 'Yeni araç garajınıza eklendi!')", "toast.success(isEditMode ? t('add_vehicle.success_edit') : t('add_vehicle.success_add'))"],
    ["toast.error('Bir hata oluştu. Lütfen tekrar deneyin.')", "toast.error(t('add_vehicle.error_save'))"],

    // Step 1
    [">MARKA<", ">{t('add_vehicle.brand')}<"],
    ["placeholder=\"Örn. BMW, Toyota\"", "placeholder={t('add_vehicle.brand_ph')}"],
    [">MODEL<", ">{t('add_vehicle.model')}<"],
    ["placeholder=\"Örn. 320i, Corolla\"", "placeholder={t('add_vehicle.model_ph')}"],
    [">YIL<", ">{t('add_vehicle.year')}<"],
    ["placeholder=\"Örn. 2023\"", "placeholder={t('add_vehicle.year_ph')}"],

    // Step 2
    [">PLAKA<", ">{t('add_vehicle.plate')}<"],
    ["placeholder=\"Örn. 34ABC123\"", "placeholder={t('add_vehicle.plate_ph')}"],
    [">KİLOMETRE<", ">{t('add_vehicle.mileage')}<"],
    ["placeholder=\"Örn. 45000\"", "placeholder={t('add_vehicle.mileage_ph')}"],
    [">ARAÇ DURUMU<", ">{t('add_vehicle.status')}<"],
    [">Sorun Yok<", ">{t('add_vehicle.status_ok')}<"],
    [">Bakım Gerekli<", ">{t('add_vehicle.status_maint')}<"],
    [">Onarımda<", ">{t('add_vehicle.status_repair')}<"],

    // Step 3
    [">ARAÇ FOTOĞRAFI<", ">{t('add_vehicle.photo')}<"],
    [">Fotoğraf yüklemek için dokunun (İsteğe Bağlı)<", ">{t('add_vehicle.photo_desc')}<"],
    [">Yükleniyor...<", ">{t('add_vehicle.uploading')}<"],

    // UI Structure
    [">Geri<", ">{t('add_vehicle.back')}<"],
    [">İleri<", ">{t('add_vehicle.next')}<"],
    [">Kaydet<", ">{t('add_vehicle.save')}<"],
    ["{isEditMode ? 'Aracı Düzenle' : 'Yeni Araç Ekle'}", "{isEditMode ? t('add_vehicle.title_edit') : t('add_vehicle.title_add')}"],
    ["`Adım ${step}/${totalSteps}`", "t('add_vehicle.step', { current: step, total: totalSteps })"]
];

for (const [s, r] of replacements) {
    if (content.includes(s)) {
        content = content.split(s).join(r);
    }
}

// We also have to translate "Sorun Yok" in the initial state. Let's do string match.
// initial state is: status: 'Sorun Yok' as Vehicle['status'], which we might leave as is for data,
// but the UI matches it to "Sorun Yok" etc. Wait, if the data expects literal "Sorun Yok", we shouldn't translate the DB value. Let's check.
// In Firebase it's saved as `status: formData.status`. If it's a fixed string in DB, translating it might break other places that expect those strings.
// But in UI: <option value="Sorun Yok">Sorun Yok</option> — wait, AddVehicle uses buttons for status:
// onClick={() => setFormData({ ...formData, status: s as any })} 
// const statuses = ['Sorun Yok', 'Bakım Gerekli', 'Onarımda'];
// So it stores exactly those strings. I will leave the DB keys as those strings and just map them in UI:
content = content.replace(
    "const statuses = ['Sorun Yok', 'Bakım Gerekli', 'Onarımda'];\n    return (\n      <div className=\"space-y-4 animate-fadeIn\">\n        <div className=\"grid grid-cols-1 gap-3\">\n          {statuses.map(s => (",
    "const statuses = ['Sorun Yok', 'Bakım Gerekli', 'Onarımda'];\n    const statusLabels: Record<string, string> = {\n      'Sorun Yok': t('add_vehicle.status_ok'),\n      'Bakım Gerekli': t('add_vehicle.status_maint'),\n      'Onarımda': t('add_vehicle.status_repair')\n    };\n    return (\n      <div className=\"space-y-4 animate-fadeIn\">\n        <div className=\"grid grid-cols-1 gap-3\">\n          {statuses.map(s => ("
);
content = content.replace(
    "<span className=\"font-medium\">{s}</span>",
    "<span className=\"font-medium\">{statusLabels[s] || s}</span>"
);

fs.writeFileSync('pages/AddVehicle.tsx', content);
console.log('AddVehicle translated!');
