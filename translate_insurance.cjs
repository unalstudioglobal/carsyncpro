const fs = require('fs');

// 1. Update Translations
const trPath = 'src/locales/tr/translation.json';
const enPath = 'src/locales/en/translation.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

trData.ins = {
    // Types
    "type_Trafik Sigortası": "Trafik Sigortası", "desc_Trafik Sigortası": "Zorunlu trafik sigortası",
    "type_Kasko": "Kasko", "desc_Kasko": "Kasko poliçesi",
    "type_Araç Muayenesi": "Araç Muayenesi", "desc_Araç Muayenesi": "Periyodik araç muayenesi",
    "type_Egzoz Muayenesi": "Egzoz Muayenesi", "desc_Egzoz Muayenesi": "Egzoz emisyon muayenesi",
    "type_MTV Ödemesi": "MTV Ödemesi", "desc_MTV Ödemesi": "Motorlu taşıtlar vergisi",
    "type_Lastik Değişimi": "Lastik Değişimi", "desc_Lastik Değişimi": "Mevsimsel lastik değişimi",
    "type_Yıllık Bakım": "Yıllık Bakım", "desc_Yıllık Bakım": "Yıllık servis bakımı",
    "type_Özel": "Özel", "desc_Özel": "Özel hatırlatma",

    // Urgency
    "urg_expired": "Süresi Doldu",
    "urg_critical": "Kritik",
    "urg_warning": "Yaklaşıyor",
    "urg_ok": "Güncel",

    "completed": "Tamamlandı",
    "unknown": "Bilinmiyor",
    "mark_completed": "Tamamlandı olarak işaretle",

    // Days
    "days_passed": "{{d}} gün geçti",
    "days_today": "Bugün son gün!",
    "days_tmrw": "Yarın son gün!",
    "days_left": "{{d}} gün kaldı",
    "months_days_left": "{{m}} ay {{d}} gün kaldı",
    "months_left": "{{m}} ay kaldı",
    "renew": "Yenile / Güncelle",
    "update_date": "Tarih Güncelle",

    // Modal
    "modal_edit": "Düzenle",
    "modal_new": "Yeni Hatırlatma",
    "modal_car": "Araç",
    "modal_type": "Belge / Hatırlatma Türü",
    "modal_expiry": "Son Geçerlilik / Yenileme Tarihi",
    "modal_rem_days": "Kaç Gün Önce Hatırlat",
    "modal_rem_val": "{{d}} gün",
    "modal_notes": "Not (isteğe bağlı)",
    "modal_notes_ph": "Sigorta şirketi, poliçe no, servis notları...",
    "modal_btn_edit": "Güncelle",
    "modal_btn_add": "Hatırlatma Ekle",

    // Main UI
    "title": "Sigorta & Muayene",
    "subtitle": "Belge ve tarih takip takvimi",

    "alert_expired": "{{c}} belgenin süresi doldu!",
    "alert_critical": "{{c}} belge 14 gün içinde sona eriyor",
    "alert_desc": "Hemen güncelle veya yenile",

    "stat_total": "Toplam",
    "stat_expired": "Süresi Doldu",
    "stat_critical": "Kritik",
    "stat_warning": "Yakında",

    "filter_all_cars": "Tüm Araçlar",
    "filter_active": "🔔 Aktif",
    "filter_completed": "✅ Tamamlandı",
    "filter_all": "Tümü",

    "doc_count": "{{c}} belge",

    "empty_title": "Henüz takvim girişi yok",
    "empty_desc": "Sigorta, muayene, MTV ve diğer belge tarihlerini ekle, son günlerden önce hatırlatma al.",
    "empty_btn": "İlk Hatırlatmayı Ekle",
    "empty_filter": "Bu filtreyle eşleşen belge yok.",

    "info": "Tarihler yaklaştığında ana sayfada uyarı görünür. Veriler cihazınızda yerel olarak saklanır.",

    "months": ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
};

enData.ins = {
    // Types
    "type_Trafik Sigortası": "Traffic Insurance", "desc_Trafik Sigortası": "Compulsory traffic insurance",
    "type_Kasko": "Casco", "desc_Kasko": "Comprehensive Casco policy",
    "type_Araç Muayenesi": "Vehicle Inspection", "desc_Araç Muayenesi": "Periodic vehicle inspection",
    "type_Egzoz Muayenesi": "Exhaust Emission", "desc_Egzoz Muayenesi": "Exhaust emission test",
    "type_MTV Ödemesi": "Tax Payment", "desc_MTV Ödemesi": "Motor vehicle tax",
    "type_Lastik Değişimi": "Tire Change", "desc_Lastik Değişimi": "Seasonal tire change",
    "type_Yıllık Bakım": "Annual Service", "desc_Yıllık Bakım": "Annual maintenance",
    "type_Özel": "Custom", "desc_Özel": "Custom reminder",

    "urg_expired": "Expired",
    "urg_critical": "Critical",
    "urg_warning": "Upcoming",
    "urg_ok": "Valid",

    "completed": "Completed",
    "unknown": "Unknown",
    "mark_completed": "Mark as completed",

    "days_passed": "{{d}} days ago",
    "days_today": "Expires today!",
    "days_tmrw": "Expires tomorrow!",
    "days_left": "{{d}} days left",
    "months_days_left": "{{m}} months {{d}} days left",
    "months_left": "{{m}} months left",
    "renew": "Renew / Update",
    "update_date": "Update Date",

    "modal_edit": "Edit",
    "modal_new": "New Reminder",
    "modal_car": "Vehicle",
    "modal_type": "Document / Reminder Type",
    "modal_expiry": "Expiry / Renewal Date",
    "modal_rem_days": "Remind Before",
    "modal_rem_val": "{{d}} days",
    "modal_notes": "Note (optional)",
    "modal_notes_ph": "Insurance company, policy number, notes...",
    "modal_btn_edit": "Update",
    "modal_btn_add": "Add Reminder",

    "title": "Insurance & Inspection",
    "subtitle": "Document and date tracking calendar",

    "alert_expired": "{{c}} documents expired!",
    "alert_critical": "{{c}} documents expire in 14 days",
    "alert_desc": "Update or renew immediately",

    "stat_total": "Total",
    "stat_expired": "Expired",
    "stat_critical": "Critical",
    "stat_warning": "Upcoming",

    "filter_all_cars": "All Vehicles",
    "filter_active": "🔔 Active",
    "filter_completed": "✅ Completed",
    "filter_all": "All",

    "doc_count": "{{c}} doc(s)",

    "empty_title": "No calendar entries yet",
    "empty_desc": "Add insurance, inspection, tax and other document dates to get reminders.",
    "empty_btn": "Add First Reminder",
    "empty_filter": "No documents match this filter.",

    "info": "Alerts will appear on the dashboard when dates approach. Data is stored locally.",

    "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
};

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

// 2. Update code
let content = fs.readFileSync('pages/InsuranceCalendar.tsx', 'utf8');

if (!content.includes('useTranslation')) {
    content = content.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}

// Subcomponents:
content = content.replace("onComplete: () => void;\n}> = ({ event, vehicleName, onEdit, onDelete, onComplete }) => {", "onComplete: () => void;\n  t: any;\n}> = ({ event, vehicleName, onEdit, onDelete, onComplete, t }) => {");

content = content.replace("onClose: () => void;\n}> = ({ vehicles, editing, onSave, onClose }) => {", "onClose: () => void;\n  t: any;\n}> = ({ vehicles, editing, onSave, onClose, t }) => {");

// Main hook
content = content.replace(
    "export const InsuranceCalendar: React.FC = () => {\n  const navigate = useNavigate();",
    "export const InsuranceCalendar: React.FC = () => {\n  const navigate = useNavigate();\n  const { t } = useTranslation();"
);

// Constants that need translation inside functions:
content = content.replace("const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];\n", "");
content = content.replace(
    "return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;",
    "const months = t('ins.months', { returnObjects: true }) as string[];\n  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;"
);
// formatDate needs 't'
content = content.replace("const formatDate = (dateStr: string) => {", "const formatDate = (dateStr: string, t: any) => {");
content = content.replace("formatDate(event.expiryDate)", "formatDate(event.expiryDate, t)");

// formatDaysLabel needs 't'
content = content.replace("const formatDaysLabel = (days: number): string => {", "const formatDaysLabel = (days: number, t: any): string => {");
content = content.replace("formatDaysLabel(days)", "formatDaysLabel(days, t)");

const formatStrLines = `  if (days < 0) return t('ins.days_passed', { d: Math.abs(days) });
  if (days === 0) return t('ins.days_today');
  if (days === 1) return t('ins.days_tmrw');
  if (days < 30) return t('ins.days_left', { d: days });
  const months = Math.floor(days / 30);
  const rem = days % 30;
  return rem > 0 ? t('ins.months_days_left', { m: months, d: rem }) : t('ins.months_left', { m: months });`;

const oldFormatLines = `  if (days < 0) return \`\${Math.abs(days)} gün geçti\`;
  if (days === 0) return 'Bugün son gün!';
  if (days === 1) return 'Yarın son gün!';
  if (days < 30) return \`\${days} gün kaldı\`;
  const months = Math.floor(days / 30);
  const rem = days % 30;
  return rem > 0 ? \`\${months} ay \${rem} gün kaldı\` : \`\${months} ay kaldı\`;`;

content = content.replace(oldFormatLines, formatStrLines);

// Use t at grouping
content = content.replace(
    "const key = `${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;",
    "const months = t('ins.months', { returnObjects: true }) as string[];\n      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;"
);

// EventCard string replacements
content = content.replace(">{event.type}<", ">{t('ins.type_' + event.type)}<");
content = content.replace(">{ucfg.label}<", ">{t('ins.urg_' + urgency)}<");
content = content.replace("Tamamlandı\n                </span>", "{t('ins.completed')}\n                </span>");
content = content.replace("title=\"Tamamlandı olarak işaretle\"", "title={t('ins.mark_completed')}");
content = content.replace("{urgency === 'expired' ? 'Yenile / Güncelle' : 'Tarih Güncelle'}", "{urgency === 'expired' ? t('ins.renew') : t('ins.update_date')}");

// EventModal string replacements
content = content.replace(">{editing ? 'Düzenle' : 'Yeni Hatırlatma'}</h3>", ">{editing ? t('ins.modal_edit') : t('ins.modal_new')}</h3>");
content = content.replace(">Araç</label>", ">{t('ins.modal_car')}</label>");
content = content.replace(">Belge / Hatırlatma Türü</label>", ">{t('ins.modal_type')}</label>");
content = content.replace(">{key}</span>", ">{t('ins.type_' + key)}</span>");
content = content.replace(">Son Geçerlilik / Yenileme Tarihi</label>", ">{t('ins.modal_expiry')}</label>");
content = content.replace("Kaç Gün Önce Hatırlat:", "{t('ins.modal_rem_days')}:");
content = content.replace(">{reminderDays} gün</span>", ">{t('ins.modal_rem_val', { d: reminderDays })}</span>");
content = content.replace(">Not (isteğe bağlı)</label>", ">{t('ins.modal_notes')}</label>");
content = content.replace("placeholder=\"Sigorta şirketi, poliçe no, servis notları...\"", "placeholder={t('ins.modal_notes_ph')}");
content = content.replace("{editing ? 'Güncelle' : 'Hatırlatma Ekle'}", "{editing ? t('ins.modal_btn_edit') : t('ins.modal_btn_add')}");

// Pass t down
content = content.replace("<EventModal\n          vehicles={vehicles}\n          editing={editingEvent}\n          onSave={handleSave}\n          onClose={() => { setShowModal(false); setEditingEvent(null); }}\n        />", "<EventModal\n          vehicles={vehicles}\n          editing={editingEvent}\n          onSave={handleSave}\n          onClose={() => { setShowModal(false); setEditingEvent(null); }}\n          t={t}\n        />");
content = content.replace("onComplete={() => handleComplete(event.id)}\n                      />", "onComplete={() => handleComplete(event.id)}\n                        t={t}\n                      />");
content = content.replace("vehicleNameMap[event.vehicleId] || 'Bilinmiyor'", "vehicleNameMap[event.vehicleId] || t('ins.unknown')");

// Main UI replacements
content = content.replace(">Sigorta & Muayene</h1>", ">{t('ins.title')}</h1>");
content = content.replace(">Belge ve tarih takip takvimi</p>", ">{t('ins.subtitle')}</p>");

content = content.replace(
    "`${stats.expired} belgenin süresi doldu!`",
    "t('ins.alert_expired', { c: stats.expired })"
);
content = content.replace(
    "`${stats.critical} belge 14 gün içinde sona eriyor`",
    "t('ins.alert_critical', { c: stats.critical })"
);
content = content.replace(">Hemen güncelle veya yenile</p>", ">{t('ins.alert_desc')}</p>");

content = content.replace("label: 'Toplam'", "label: t('ins.stat_total')");
content = content.replace("label: 'Süresi Doldu'", "label: t('ins.stat_expired')");
content = content.replace("label: 'Kritik'", "label: t('ins.stat_critical')");
content = content.replace("label: 'Yakında'", "label: t('ins.stat_warning')");

content = content.replace(">\n                Tüm Araçlar\n              </button>", ">\n                {t('ins.filter_all_cars')}\n              </button>");
content = content.replace("{ key: 'active', label: '🔔 Aktif' }", "{ key: 'active', label: t('ins.filter_active') }");
content = content.replace("{ key: 'completed', label: '✅ Tamamlandı' }", "{ key: 'completed', label: t('ins.filter_completed') }");
content = content.replace("{ key: 'all', label: 'Tümü' }", "{ key: 'all', label: t('ins.filter_all') }");

content = content.replace(">{events.length} belge</p>", ">{t('ins.doc_count', { c: events.length })}</p>");

content = content.replace(">Henüz takvim girişi yok</p>", ">{t('ins.empty_title')}</p>");
content = content.replace(">\n              Sigorta, muayene, MTV ve diğer belge tarihlerini ekle, son günlerden önce hatırlatma al.\n            </p>", ">\n              {t('ins.empty_desc')}\n            </p>");
content = content.replace(">\n              <Plus size={16} />\n              İlk Hatırlatmayı Ekle\n            </button>", ">\n              <Plus size={16} />\n              {t('ins.empty_btn')}\n            </button>");
content = content.replace(">K<", ">{t('ins.type_' + k)}<");

content = content.replace(">Bu filtreyle eşleşen belge yok.</p>", ">{t('ins.empty_filter')}</p>");
content = content.replace(">\n              Tarihler yaklaştığında ana sayfada uyarı görünür. Veriler cihazınızda yerel olarak saklanır.\n            </p>", ">\n              {t('ins.info')}\n            </p>");

fs.writeFileSync('pages/InsuranceCalendar.tsx', content);
console.log('InsuranceCalendar translated!');
