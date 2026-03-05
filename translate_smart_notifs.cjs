const fs = require('fs');

// 1. Update Translations
const trPath = 'src/locales/tr/translation.json';
const enPath = 'src/locales/en/translation.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

trData.smart_notifs = {
    // Rules
    "rule_oil": "Yağ Değişimi",
    "rule_oil_desc": "Son yağ değişiminin üzerinden 10.000+ km geçtiyse",
    "rule_service": "Periyodik Bakım",
    "rule_service_desc": "Son bakımın üzerinden 15.000+ km geçtiyse",
    "rule_tire": "Lastik Rotasyonu",
    "rule_tire_desc": "Son rotasyonun üzerinden 10.000+ km geçtiyse",
    "rule_brake": "Fren Kontrolü",
    "rule_brake_desc": "Son fren servisinin üzerinden 30.000+ km geçtiyse",
    "rule_battery": "Akü Uyarısı",
    "rule_battery_desc": "Son akü değişiminin üzerinden 60.000+ km geçtiyse",
    "rule_inspection": "Muayene Hatırlatma",
    "rule_inspection_desc": "Araç muayenesi 2 yılı aştıysa",
    "rule_health": "Düşük Sağlık Skoru",
    "rule_health_desc": "Araç sağlık skoru 50'nin altına düştüyse",
    "rule_fuel": "Yakıt Takibi",
    "rule_fuel_desc": "30 gün içinde yakıt kaydı girilmediyse",
    "rule_budget": "Yüksek Aylık Harcama",
    "rule_budget_desc": "Aylık harcama 5.000 TL'yi aştıysa",
    "rule_achievement": "Başarılar",
    "rule_achievement_desc": "Kilometre ve bakım başarıları için kutlama bildirimi",

    // Rule generation text
    "msg_oil_crit_title": "Yağ Değişimi Gecikmiş!",
    "msg_oil_crit_body": "{{vehicle}} — Son yağ değişiminden {{km}} km geçti. Hemen servis ayarlayın.",
    "msg_add_record": "Kayıt Ekle",
    "msg_oil_warn_title": "Yağ Değişimi Yaklaşıyor",
    "msg_oil_warn_body": "{{vehicle}} — {{km}} km geçti, ~{{rem}} km kaldı.",
    "msg_schedule": "Randevu Al",

    "msg_serv_crit_title": "Periyodik Bakım Gecikmiş!",
    "msg_serv_crit_body": "{{vehicle}} — Son bakımdan {{km}} km geçti. Acil servis gerekiyor.",
    "msg_add_serv": "Servis Ekle",
    "msg_serv_warn_title": "Periyodik Bakım Zamanı",
    "msg_serv_warn_body": "{{vehicle}} — {{km}} km geçti. Yakında servis zamanı.",
    "msg_plan": "Planla",

    "msg_tire_title": "Lastik Rotasyonu Zamanı",
    "msg_tire_body": "{{vehicle}} — {{km}} km geçti. Lastik ömrünü uzatmak için rotasyon yaptırın.",
    "msg_add": "Ekle",

    "msg_brake_title": "Fren Kontrolü Gerekli",
    "msg_brake_body": "{{vehicle}} — Son fren servisinden {{km}} km geçti. Balata durumunu kontrol ettirin.",

    "msg_batt_title": "Akü Kontrolü",
    "msg_batt_body": "{{vehicle}} — {{km}} km. Akü ömrü dolmuş olabilir. Kontrol ettirin.",
    "msg_save": "Kaydet",

    "msg_health_title": "Düşük Sağlık Skoru: {{score}}/100",
    "msg_health_body": "{{vehicle}} — Araç sağlık skoru kritik seviyede. Acil servis öneriyoruz.",
    "msg_details": "Detaylar",

    "msg_fuel_title": "Yakıt Takibi Hatırlatması",
    "msg_fuel_body": "{{vehicle}} — {{days}} gündür yakıt kaydı yok. Tüketim analizin için kayıt ekle.",

    "msg_budget_title": "Yüksek Aylık Harcama",
    "msg_budget_body": "{{vehicle}} — Bu ay ₺{{total}} harcandı. Bütçeni gözden geçir.",
    "msg_budget_goals": "Bütçe Hedefleri",

    "msg_ach_title": "🎉 100.000 km Başarısı!",
    "msg_ach_body": "{{vehicle}} 100.000 km'yi geçti! Uzun yollar önünüzde. Özel bakım önerilerini görün.",
    "msg_view_car": "Aracı Gör",

    "msg_welcome_title": "CarSync Pro'ya Hoş Geldiniz! 🚗",
    "msg_welcome_body": "Araçlarınızı kaydedin ve akıllı bildirimlerden yararlanmaya başlayın.",
    "msg_go_garage": "Garaja Git",

    // Common UI
    "time_just_now": "Az önce",
    "time_mins": "{{m}} dk önce",
    "time_hours": "{{h}} sa önce",
    "time_days": "{{d}} gün önce",

    "push_success": "Push bildirimler aktif! Artık bakım hatırlatmalarını alacaksınız. 🚗",
    "scanning": "Bildirimler taranıyor...",
    "title": "Bildirimler",
    "subtitle": "Kural tabanlı akıllı uyarı sistemi",
    "rules_title": "Bildirim Kuralları",

    "filter_all": "Tümü",
    "filter_unread": "Okunmamış",
    "filter_critical": "Kritik",
    "filter_warning": "Uyarı",
    "filter_reminder": "Hatırlatma",
    "filter_success": "Başarı",

    "crit_alert_title": "{{count}} Kritik Uyarı",
    "crit_alert_desc": "Araçlarınızda acil müdahale gerekebilir.",
    "crit_alert_action": "Gör",

    "push_active": "Push Bildirimler Aktif",
    "push_enable": "Push Bildirimleri Etkinleştir",
    "push_desc": "Tarayıcı bildirimleri için izin ver",

    "btn_scan": "Yeniden Tara",
    "btn_scanning": "Taranıyor...",
    "btn_read_all": "Tümünü Okundu İşaretle",
    "btn_clear": "Temizle",

    "empty_title_all": "Bildirim Yok",
    "empty_title_filter": "Bu filtrede bildirim yok",
    "empty_desc_all": "Araçlarınız iyi durumda görünüyor. Yeni uyarılar burada görünecek.",
    "empty_desc_filter": "Diğer filtrelere bakabilir veya tüm bildirimleri görebilirsiniz.",
    "empty_btn": "Araçları Tara",

    "cat_maint": "Bakım", "cat_fuel": "Yakıt", "cat_ins": "Sigorta", "cat_budget": "Bütçe", "cat_sys": "Sistem", "cat_ach": "Başarı",
    "catl_maint": "🔧 Bakım", "catl_fuel": "⛽ Yakıt", "catl_ins": "🛡️ Sigorta", "catl_budget": "💰 Bütçe", "catl_sys": "⚙️ Sistem", "catl_ach": "🏆 Başarılar",

    "months": ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
};

enData.smart_notifs = {
    // Rules
    "rule_oil": "Oil Change",
    "rule_oil_desc": "If 10,000+ km has passed since the last oil change",
    "rule_service": "Periodic Maintenance",
    "rule_service_desc": "If 15,000+ km has passed since the last service",
    "rule_tire": "Tire Rotation",
    "rule_tire_desc": "If 10,000+ km has passed since the last rotation",
    "rule_brake": "Brake Check",
    "rule_brake_desc": "If 30,000+ km has passed since the last brake service",
    "rule_battery": "Battery Warning",
    "rule_battery_desc": "If 60,000+ km has passed since the last battery replacement",
    "rule_inspection": "Inspection Reminder",
    "rule_inspection_desc": "If vehicle inspection is over 2 years",
    "rule_health": "Low Health Score",
    "rule_health_desc": "If vehicle health score drops below 50",
    "rule_fuel": "Fuel Tracking",
    "rule_fuel_desc": "If no fuel record is entered within 30 days",
    "rule_budget": "High Monthly Expense",
    "rule_budget_desc": "If monthly expense exceeds $500",
    "rule_achievement": "Achievements",
    "rule_achievement_desc": "Celebration notification for mileage and maintenance achievements",

    // Rule generation text
    "msg_oil_crit_title": "Oil Change Overdue!",
    "msg_oil_crit_body": "{{vehicle}} — {{km}} km passed since last oil change. Schedule service immediately.",
    "msg_add_record": "Add Record",
    "msg_oil_warn_title": "Oil Change Upcoming",
    "msg_oil_warn_body": "{{vehicle}} — {{km}} km passed, ~{{rem}} km remaining.",
    "msg_schedule": "Schedule",

    "msg_serv_crit_title": "Periodic Maintenance Overdue!",
    "msg_serv_crit_body": "{{vehicle}} — {{km}} km passed since last service. Urgent service required.",
    "msg_add_serv": "Add Service",
    "msg_serv_warn_title": "Periodic Maintenance Time",
    "msg_serv_warn_body": "{{vehicle}} — {{km}} km passed. Service time soon.",
    "msg_plan": "Plan",

    "msg_tire_title": "Tire Rotation Time",
    "msg_tire_body": "{{vehicle}} — {{km}} km passed. Rotate tires to extend life.",
    "msg_add": "Add",

    "msg_brake_title": "Brake Check Required",
    "msg_brake_body": "{{vehicle}} — {{km}} km passed since last brake service. Check brake pads.",

    "msg_batt_title": "Battery Check",
    "msg_batt_body": "{{vehicle}} — {{km}} km passed. Battery life may be over. Check it.",
    "msg_save": "Save",

    "msg_health_title": "Low Health Score: {{score}}/100",
    "msg_health_body": "{{vehicle}} — Vehicle health score is critical. Urgent service recommended.",
    "msg_details": "Details",

    "msg_fuel_title": "Fuel Tracking Reminder",
    "msg_fuel_body": "{{vehicle}} — No fuel record for {{days}} days. Add record for consumption analysis.",

    "msg_budget_title": "High Monthly Expense",
    "msg_budget_body": "{{vehicle}} — ${{total}} spent this month. Review your budget.",
    "msg_budget_goals": "Budget Goals",

    "msg_ach_title": "🎉 100,000 km Achievement!",
    "msg_ach_body": "{{vehicle}} passed 100,000 km! Long roads ahead. See special maintenance tips.",
    "msg_view_car": "View Car",

    "msg_welcome_title": "Welcome to CarSync Pro! 🚗",
    "msg_welcome_body": "Register your vehicles and start benefiting from smart notifications.",
    "msg_go_garage": "Go to Garage",

    // Common UI
    "time_just_now": "Just now",
    "time_mins": "{{m}} mins ago",
    "time_hours": "{{h}} hrs ago",
    "time_days": "{{d}} days ago",

    "push_success": "Push notifications active! You will now receive maintenance reminders. 🚗",
    "scanning": "Scanning notifications...",
    "title": "Notifications",
    "subtitle": "Rule-based smart alert system",
    "rules_title": "Notification Rules",

    "filter_all": "All",
    "filter_unread": "Unread",
    "filter_critical": "Critical",
    "filter_warning": "Warning",
    "filter_reminder": "Reminder",
    "filter_success": "Success",

    "crit_alert_title": "{{count}} Critical Alerts",
    "crit_alert_desc": "Your vehicles may need urgent attention.",
    "crit_alert_action": "View",

    "push_active": "Push Notifications Active",
    "push_enable": "Enable Push Notifications",
    "push_desc": "Allow permissions for browser notifications",

    "btn_scan": "Rescan",
    "btn_scanning": "Scanning...",
    "btn_read_all": "Mark All as Read",
    "btn_clear": "Clear",

    "empty_title_all": "No Notifications",
    "empty_title_filter": "No notifications in this filter",
    "empty_desc_all": "Your vehicles seem to be in good condition. New alerts will appear here.",
    "empty_desc_filter": "You can check other filters or view all notifications.",
    "empty_btn": "Scan Vehicles",

    "cat_maint": "Maintenance", "cat_fuel": "Fuel", "cat_ins": "Insurance", "cat_budget": "Budget", "cat_sys": "System", "cat_ach": "Achievement",
    "catl_maint": "🔧 Maintenance", "catl_fuel": "⛽ Fuel", "catl_ins": "🛡️ Insurance", "catl_budget": "💰 Budget", "catl_sys": "⚙️ System", "catl_ach": "🏆 Achievements",

    "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
};

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

// 2. Update code (this is tricky because rules and texts are in constants/functions outside Component)
// We will export a generic getSmartNotifText(key, t, params) maybe? 
// Or just inject `import { i18n } from '../i18n'; ` and use `i18n.t` directly in standalone functions! This is much cleaner!

let content = fs.readFileSync('pages/SmartNotifications.tsx', 'utf8');

if (!content.includes("i18n.t")) {
    content = content.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport i18n from '../i18n';\nimport { useTranslation } from 'react-i18next';"
    );
}
// i18n is default exported? Let's check i18n.ts
// Wait, we can import `i18n` directly from i18n.ts but let's just make sure. Yes: `import i18n from '../i18n';` (if it's default export. i18n was imported in index.tsx as `import './i18n';` so i18next instance is available.
// Actually `i18n.ts` export default i18n; is standard. Let's see if we can just use `t` from useTranslation for UI, and `i18n.t` for rules.

// We will change DEFAULT_RULES to a function `getDefaultRules(t: any)` so it dynamically generates, or we translate them inside the component where needed.
// Easiest is translating at rendering and function calls.

// 1. DEFAULT_RULES
// Let's change the usage. `const savedRules = loadRules(t);`
content = content.replace("const loadRules = (): NotifRule[] => {", "const loadRules = (t: any): NotifRule[] => {");
content = content.replace("return DEFAULT_RULES;", "return DEFAULT_RULES.map(r => ({ ...r, label: t(`smart_notifs.rule_${r.id.replace('_due', '').replace('_log', '')}`) || r.label, description: t(`smart_notifs.rule_${r.id.replace('_due', '').replace('_log', '')}_desc`) || r.description }));");
content = content.replace(
    "return DEFAULT_RULES.map(def => {",
    "return DEFAULT_RULES.map(def => {\n      def.label = t(`smart_notifs.rule_${def.id.replace('_due', '').replace('_log', '')}`) || def.label;\n      def.description = t(`smart_notifs.rule_${def.id.replace('_due', '').replace('_log', '')}_desc`) || def.description;"
);

// 2. timeAgo -> timeAgo(date, t)
content = content.replace("const timeAgo = (dateStr: string): string => {", "const timeAgo = (dateStr: string, t: any): string => {");
content = content.replace("return 'Az önce';", "return t('smart_notifs.time_just_now');");
content = content.replace("return `${mins} dk önce`;", "return t('smart_notifs.time_mins', { m: mins });");
content = content.replace("return `${hours} sa önce`;", "return t('smart_notifs.time_hours', { h: hours });");
content = content.replace("return `${days} gün önce`;", "return t('smart_notifs.time_days', { d: days });");
content = content.replace(
    "const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];",
    ""
);
content = content.replace(
    "return `${d.getDate()} ${MONTHS_TR[d.getMonth()]}`;",
    "const months = t('smart_notifs.months', { returnObjects: true }) as string[];\n  return `${d.getDate()} ${months[d.getMonth()]}`;"
);

// 3. runRuleEngine -> runRuleEngine(..., t)
content = content.replace(
    "existingNotifs: SmartNotif[]\n): SmartNotif[] => {",
    "existingNotifs: SmartNotif[],\n  t: any\n): SmartNotif[] => {"
);
// Replace messages
const engineReplacements = [
    ["'Yağ Değişimi Gecikmiş!'", "t('smart_notifs.msg_oil_crit_title')"],
    ["`${vName} — Son yağ değişiminden ${kmSince.toLocaleString('tr-TR')} km geçti. Hemen servis ayarlayın.`", "t('smart_notifs.msg_oil_crit_body', { vehicle: vName, km: kmSince.toLocaleString() })"],
    ["'Kayıt Ekle'", "t('smart_notifs.msg_add_record')"],

    ["'Yağ Değişimi Yaklaşıyor'", "t('smart_notifs.msg_oil_warn_title')"],
    ["`${vName} — ${kmSince.toLocaleString('tr-TR')} km geçti, ~${(10000 - kmSince).toLocaleString('tr-TR')} km kaldı.`", "t('smart_notifs.msg_oil_warn_body', { vehicle: vName, km: kmSince.toLocaleString(), rem: (10000 - kmSince).toLocaleString() })"],
    ["'Randevu Al'", "t('smart_notifs.msg_schedule')"],

    ["'Periyodik Bakım Gecikmiş!'", "t('smart_notifs.msg_serv_crit_title')"],
    ["`${vName} — Son bakımdan ${kmSince.toLocaleString('tr-TR')} km geçti. Acil servis gerekiyor.`", "t('smart_notifs.msg_serv_crit_body', { vehicle: vName, km: kmSince.toLocaleString() })"],
    ["'Servis Ekle'", "t('smart_notifs.msg_add_serv')"],

    ["'Periyodik Bakım Zamanı'", "t('smart_notifs.msg_serv_warn_title')"],
    ["`${vName} — ${kmSince.toLocaleString('tr-TR')} km geçti. Yakında servis zamanı.`", "t('smart_notifs.msg_serv_warn_body', { vehicle: vName, km: kmSince.toLocaleString() })"],
    ["'Planla'", "t('smart_notifs.msg_plan')"],

    ["'Lastik Rotasyonu Zamanı'", "t('smart_notifs.msg_tire_title')"],
    ["`${vName} — ${kmSince.toLocaleString('tr-TR')} km geçti. Lastik ömrünü uzatmak için rotasyon yaptırın.`", "t('smart_notifs.msg_tire_body', { vehicle: vName, km: kmSince.toLocaleString() })"],
    ["'Ekle'", "t('smart_notifs.msg_add')"],

    ["'Fren Kontrolü Gerekli'", "t('smart_notifs.msg_brake_title')"],
    ["`${vName} — Son fren servisinden ${kmSince.toLocaleString('tr-TR')} km geçti. Balata durumunu kontrol ettirin.`", "t('smart_notifs.msg_brake_body', { vehicle: vName, km: kmSince.toLocaleString() })"],

    ["'Akü Kontrolü'", "t('smart_notifs.msg_batt_title')"],
    ["`${vName} — ${kmSince.toLocaleString('tr-TR')} km. Akü ömrü dolmuş olabilir. Kontrol ettirin.`", "t('smart_notifs.msg_batt_body', { vehicle: vName, km: kmSince.toLocaleString() })"],
    ["'Kaydet'", "t('smart_notifs.msg_save')"],

    ["`Düşük Sağlık Skoru: ${v.healthScore}/100`", "t('smart_notifs.msg_health_title', { score: v.healthScore })"],
    ["`${vName} — Araç sağlık skoru kritik seviyede. Acil servis öneriyoruz.`", "t('smart_notifs.msg_health_body', { vehicle: vName })"],
    ["'Detaylar'", "t('smart_notifs.msg_details')"],

    ["'Yakıt Takibi Hatırlatması'", "t('smart_notifs.msg_fuel_title')"],
    ["`${vName} — ${daysSince} gündür yakıt kaydı yok. Tüketim analizin için kayıt ekle.`", "t('smart_notifs.msg_fuel_body', { vehicle: vName, days: daysSince })"],

    ["'Yüksek Aylık Harcama'", "t('smart_notifs.msg_budget_title')"],
    ["`${vName} — Bu ay ₺${monthTotal.toLocaleString('tr-TR')} harcandı. Bütçeni gözden geçir.`", "t('smart_notifs.msg_budget_body', { vehicle: vName, total: monthTotal.toLocaleString() })"],
    ["'Bütçe Hedefleri'", "t('smart_notifs.msg_budget_goals')"],

    ["`🎉 100.000 km Başarısı!`", "t('smart_notifs.msg_ach_title')"],
    ["`${vName} 100.000 km'yi geçti! Uzun yollar önünüzde. Özel bakım önerilerini görün.`", "t('smart_notifs.msg_ach_body', { vehicle: vName })"],
    ["'Aracı Gör'", "t('smart_notifs.msg_view_car')"],

    ["'CarSync Pro\\'ya Hoş Geldiniz! 🚗'", "t('smart_notifs.msg_welcome_title')"],
    ["'Araçlarınızı kaydedin ve akıllı bildirimlerden yararlanmaya başlayın.'", "t('smart_notifs.msg_welcome_body')"],
    ["'Garaja Git'", "t('smart_notifs.msg_go_garage')"]
];

for (const [s, r] of engineReplacements) {
    if (content.includes(s)) content = content.split(s).join(r);
}

// 4. Pass 't' inside subcomponents
content = content.replace(
    "onAction: (route: string) => void;\n}> = ({ notif, onRead, onDismiss, onAction }) => {",
    "onAction: (route: string) => void;\n  t: any;\n}> = ({ notif, onRead, onDismiss, onAction, t }) => {"
);
content = content.replace("timeAgo(notif.createdAt)", "timeAgo(notif.createdAt, t)");

const catTransStr = `{notif.category === 'maintenance' ? t('smart_notifs.cat_maint') :
                notif.category === 'fuel' ? t('smart_notifs.cat_fuel') :
                  notif.category === 'insurance' ? t('smart_notifs.cat_ins') :
                    notif.category === 'budget' ? t('smart_notifs.cat_budget') :
                      notif.category === 'achievement' ? t('smart_notifs.cat_ach') : t('smart_notifs.cat_sys')}`;
content = content.replace(
    `{notif.category === 'maintenance' ? 'Bakım' :
                notif.category === 'fuel' ? 'Yakıt' :
                  notif.category === 'insurance' ? 'Sigorta' :
                    notif.category === 'budget' ? 'Bütçe' :
                      notif.category === 'achievement' ? 'Başarı' : 'Sistem'}`,
    catTransStr
);

content = content.replace(
    "onClose: () => void;\n}> = ({ rules, onToggle, onClose }) => {",
    "onClose: () => void;\n  t: any;\n}> = ({ rules, onToggle, onClose, t }) => {"
);
const catLabelsOld = `const catLabels: Record<NotifCategory, string> = {
    maintenance: '🔧 Bakım', fuel: '⛽ Yakıt', insurance: '🛡️ Sigorta',
    budget: '💰 Bütçe', system: '⚙️ Sistem', achievement: '🏆 Başarılar',
  };`;
const catLabelsNew = `const catLabels: Record<NotifCategory, string> = {
    maintenance: t('smart_notifs.catl_maint'), fuel: t('smart_notifs.catl_fuel'), insurance: t('smart_notifs.catl_ins'),
    budget: t('smart_notifs.catl_budget'), system: t('smart_notifs.catl_sys'), achievement: t('smart_notifs.catl_ach'),
  };`;
content = content.replace(catLabelsOld, catLabelsNew);
content = content.replace(">Bildirim Kuralları</h3>", ">{t('smart_notifs.rules_title')}</h3>");

// 5. Main Component translations
content = content.replace(
    "export const SmartNotifications: React.FC = () => {\n  const navigate = useNavigate();",
    "export const SmartNotifications: React.FC = () => {\n  const navigate = useNavigate();\n  const { t } = useTranslation();"
);

// Map usage of t
content = content.replace("const savedRules = loadRules()", "const savedRules = loadRules(t)");
content = content.replace("const fresh = runRuleEngine(v, l, savedRules, savedNotifs);", "const fresh = runRuleEngine(v, l, savedRules, savedNotifs, t);");
content = content.replace("const fresh = runRuleEngine(v, l, rules, cleared);", "const fresh = runRuleEngine(v, l, rules, cleared, t);");

// UI texts inside main
const mainReps = [
    ["toast.success('Push bildirimler aktif! Artık bakım hatırlatmalarını alacaksınız. 🚗', { duration: 5000 });", "toast.success(t('smart_notifs.push_success'), { duration: 5000 });"],
    [">Bildirimler taranıyor...</p>", ">{t('smart_notifs.scanning')}</p>"],
    [">Bildirimler<", ">{t('smart_notifs.title')}<"],
    [">Kural tabanlı akıllı uyarı sistemi</p>", ">{t('smart_notifs.subtitle')}</p>"],

    // Filters array
    ["{ key: 'all', label: 'Tümü' }", "{ key: 'all', label: t('smart_notifs.filter_all') }"],
    ["{ key: 'unread', label: '🔵 Okunmamış' }", "{ key: 'unread', label: `🔵 ${t('smart_notifs.filter_unread')}` }"],
    ["{ key: 'critical', label: '🔴 Kritik' }", "{ key: 'critical', label: `🔴 ${t('smart_notifs.filter_critical')}` }"],
    ["{ key: 'warning', label: '🟡 Uyarı' }", "{ key: 'warning', label: `🟡 ${t('smart_notifs.filter_warning')}` }"],
    ["{ key: 'reminder', label: '🟣 Hatırlatma' }", "{ key: 'reminder', label: `🟣 ${t('smart_notifs.filter_reminder')}` }"],
    ["{ key: 'success', label: '🟢 Başarı' }", "{ key: 'success', label: `🟢 ${t('smart_notifs.filter_success')}` }"],

    // Alerts
    [">{criticalCount} Kritik Uyarı</p>", ">{t('smart_notifs.crit_alert_title', { count: criticalCount })}</p>"],
    [">Araçlarınızda acil müdahale gerekebilir.</p>", ">{t('smart_notifs.crit_alert_desc')}</p>"],
    [">Gör</button>", ">{t('smart_notifs.crit_alert_action')}</button>"],

    // Push toggles
    ["? 'Push Bildirimler Aktif' : 'Push Bildirimleri Etkinleştir'", "? t('smart_notifs.push_active') : t('smart_notifs.push_enable')"],
    [">Tarayıcı bildirimleri için izin ver</p>", ">{t('smart_notifs.push_desc')}</p>"],

    // Actions
    ["{scanning ? 'Taranıyor...' : 'Yeniden Tara'}", "{scanning ? t('smart_notifs.btn_scanning') : t('smart_notifs.btn_scan')}"],
    [">\n                Tümünü Okundu İşaretle", ">\n                {t('smart_notifs.btn_read_all')}"],
    [">\n              Temizle", ">\n              {t('smart_notifs.btn_clear')}"],

    // Empty state
    ["{filter === 'all' ? 'Bildirim Yok' : 'Bu filtrede bildirim yok'}", "{filter === 'all' ? t('smart_notifs.empty_title_all') : t('smart_notifs.empty_title_filter')}"],
    ["{filter === 'all'\n                ? 'Araçlarınız iyi durumda görünüyor. Yeni uyarılar burada görünecek.'\n                : 'Diğer filtrelere bakabilir veya tüm bildirimleri görebilirsiniz.'}", "{filter === 'all' ? t('smart_notifs.empty_desc_all') : t('smart_notifs.empty_desc_filter')}"],
    [">\n              Araçları Tara\n            </button>", ">\n              {t('smart_notifs.empty_btn')}\n            </button>"]
];

for (const [s, r] of mainReps) {
    if (content.includes(s)) content = content.split(s).join(r);
}

// Ensure t is passed to NotifCard and RulesPanel where used in render
content = content.replace("onAction={route => navigate(route)}", "onAction={route => navigate(route)}\n                t={t}");
content = content.replace("<RulesPanel rules={rules} onToggle={handleToggleRule} onClose={() => setShowRules(false)} />", "<RulesPanel rules={rules} onToggle={handleToggleRule} onClose={() => setShowRules(false)} t={t} />");

fs.writeFileSync('pages/SmartNotifications.tsx', content);
console.log('SmartNotifications translated!');
