const fs = require('fs');

// 1. Update Translations
const trPath = 'src/locales/tr/translation.json';
const enPath = 'src/locales/en/translation.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

trData.logs = {
    "months": ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
    "unknown_vehicle": "Bilinmeyen Araç",
    "confirm_delete": "Bu kaydı silmek istediğinize emin misiniz?",
    "err_delete": "Kayıt silinemedi. Tekrar deneyin.",
    "history": "Geçmiş",
    "title": "Servis Kayıtları",
    "total": "Toplam",
    "fuel": "Yakıt",
    "action_count": "İşlem",
    "search_ph": "İşlem türü, araç veya not ara...",
    "all_vehicles": "Tüm Araçlar",
    "all_types": "Tüm Türler",
    "no_record": "Kayıt Bulunamadı",
    "no_record_filter": "Filtreleri değiştirmeyi deneyin.",
    "no_record_yet": "Henüz servis kaydı yok. Yeni kayıt ekleyin.",
    "add_first": "İlk Kaydı Ekle",
    "km_suffix": "km"
};

enData.logs = {
    "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    "unknown_vehicle": "Unknown Vehicle",
    "confirm_delete": "Are you sure you want to delete this record?",
    "err_delete": "Could not delete record. Please try again.",
    "history": "History",
    "title": "Service Logs",
    "total": "Total",
    "fuel": "Fuel",
    "action_count": "Actions",
    "search_ph": "Search service type, vehicle or notes...",
    "all_vehicles": "All Vehicles",
    "all_types": "All Types",
    "no_record": "No Record Found",
    "no_record_filter": "Try changing the filters.",
    "no_record_yet": "No service logs yet. Add a new record.",
    "add_first": "Add First Record",
    "km_suffix": "km"
};

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

// 2. Update Logs.tsx
let content = fs.readFileSync('pages/Logs.tsx', 'utf8');

if (!content.includes('useTranslation')) {
    content = content.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}

// Pass t function to helpers
// 1. groupByMonth
if (!content.includes("const groupByMonth = (logs: ServiceLog[], t: any) => {")) {
    content = content.replace(
        "const groupByMonth = (logs: ServiceLog[]) => {",
        "const groupByMonth = (logs: ServiceLog[], t: any) => {"
    );
    content = content.replace(
        "const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',\n                      'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];\n      label = `${months[d.getMonth()]} ${d.getFullYear()}`;",
        "const months = t('logs.months', { returnObjects: true }) as string[];\n      label = `${months[d.getMonth()]} ${d.getFullYear()}`;"
    );
}

// 2. vehicleName
if (!content.includes("const vehicleName = (id: string, t: any) => {")) {
    content = content.replace(
        "const vehicleName = (id: string) => {",
        "const vehicleName = (id: string, t: any) => {"
    );
    content = content.replace(
        "return v ? `${v.brand} ${v.model}` : 'Bilinmeyen Araç';",
        "return v ? `${v.brand} ${v.model}` : t('logs.unknown_vehicle');"
    );
}

// 3. inside component
if (!content.includes("const { t } = useTranslation();")) {
    content = content.replace(
        "const navigate = useNavigate();",
        "const navigate = useNavigate();\n  const { t } = useTranslation();"
    );
}

// update groupByMonth call
content = content.replace(
    "const grouped = useMemo(() => groupByMonth(filtered), [filtered]);",
    "const grouped = useMemo(() => groupByMonth(filtered, t), [filtered, t]);"
);

// update vehicleName call in filtered
content = content.replace(
    "vehicleName(log.vehicleId).toLowerCase()",
    "vehicleName(log.vehicleId, t).toLowerCase()"
);

// update delete confirmation
content = content.replace(
    "if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;",
    "if (!window.confirm(t('logs.confirm_delete'))) return;"
);
content = content.replace(
    "toast.error('Kayıt silinemedi. Tekrar deneyin.');",
    "toast.error(t('logs.err_delete'));"
);

// Replacements
const rep = [
    [">Geçmiş<", ">{t('logs.history')}<"],
    [">Servis Kayıtları<", ">{t('logs.title')}<"],
    [">Toplam<", ">{t('logs.total')}<"],
    [">Yakıt<", ">{t('logs.fuel')}<"],
    [">İşlem<", ">{t('logs.action_count')}<"],
    ["placeholder=\"İşlem türü, araç veya not ara...\"", "placeholder={t('logs.search_ph')}"],
    [">Tüm Araçlar<", ">{t('logs.all_vehicles')}<"],
    // Type filter
    ["{t === 'all' ? 'Tüm Türler' : t}", "{t === 'all' ? tTrans('logs.all_types') : (tTrans(`add_record.type_${(Object.keys(SERVICE_META).findIndex(k => k === t) > -1 ? Object.keys(SERVICE_META).indexOf(t) : 'other')}`) || t)}"],
];

// wait, type translation is complex because log types are saved in DB. e.g. "Yakıt Alımı". 
// I translated them in add_record as type_fuel. I should map them.
content = content.replace(
    "{t === 'all' ? 'Tüm Türler' : t}",
    "{t === 'all' ? t('logs.all_types') : t(`add_record.type_${t.replace(/\\s|[&]/g,'').toLowerCase()}`, { defaultValue: t })}"
);
// In list
// <h3 className="font-bold text-sm text-white truncate pr-2">{log.type}</h3>
content = content.replace(
    "<h3 className=\"font-bold text-sm text-white truncate pr-2\">{log.type}</h3>",
    "<h3 className=\"font-bold text-sm text-white truncate pr-2\">{t(`add_record.type_${log.type.replace(/\\s|[&]/g,'').toLowerCase()}`, { defaultValue: log.type })}</h3>"
);

const simpleRep = [
    [">Geçmiş<", ">{t('logs.history')}<"],
    [">Servis Kayıtları<", ">{t('logs.title')}<"],
    [">Toplam<", ">{t('logs.total')}<"],
    // fuel -> but wait, <div className="text-xs text-slate-400 mb-0.5">Yakıt</div>
    ["<div className=\"text-xs text-slate-400 mb-0.5\">Yakıt</div>", "<div className=\"text-xs text-slate-400 mb-0.5\">{t('logs.fuel')}</div>"],
    [">İşlem</div>", ">{t('logs.action_count')}</div>"],
    ["placeholder=\"İşlem türü, araç veya not ara...\"", "placeholder={t('logs.search_ph')}"],
    [">Tüm Araçlar<", ">{t('logs.all_vehicles')}<"],
    [">Kayıt Bulunamadı<", ">{t('logs.no_record')}<"],
    ["? 'Filtreleri değiştirmeyi deneyin.'", "? t('logs.no_record_filter')"],
    [": 'Henüz servis kaydı yok. Yeni kayıt ekleyin.'}", ": t('logs.no_record_yet')}"],
    [">İlk Kaydı Ekle<", ">{t('logs.add_first')}<"],
    [">Tüm Türler<", ">{t('logs.all_types')}<"],
    [" km</span>", " {t('logs.km_suffix')}</span>"]
];

for (const [s, r] of simpleRep) {
    if (content.includes(s)) content = content.split(s).join(r);
}

fs.writeFileSync('pages/Logs.tsx', content);
console.log('Logs translated!');
