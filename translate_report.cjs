const fs = require('fs');

// 1. Update Translations
const trPath = 'src/locales/tr/translation.json';
const enPath = 'src/locales/en/translation.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

trData.report = {
    // Types
    "log_fuel": "Yakıt Alımı",
    "log_oil": "Yağ Değişimi",
    "log_periodic": "Periyodik Bakım",
    "log_tire_change": "Lastik Değişimi",
    "log_tire_rot": "Lastik Rotasyonu",
    "log_brake": "Fren Servisi",
    "log_battery": "Akü Değişimi",
    "log_inspection": "Muayene",
    "log_wash": "Yıkama & Detay",

    // Dates
    "range_3m": "3A", "range_6m": "6A", "range_1y": "1Y", "range_2y": "2Y", "range_all": "Tümü",

    // UI
    "loading": "Yükleniyor...",
    "title": "PDF Rapor",
    "subtitle": "Servis geçmişi & finansal analiz",
    "pdf": "PDF",
    "vehicle": "Araç",
    "date_range": "Tarih Aralığı",
    "report_content": "Rapor İçeriği",

    "opt_summary": "Özet İstatistikler",
    "opt_summary_desc": "Toplam harcama, km analizi, yakıt tüketimi",
    "opt_details": "Detaylı Kayıt Tablosu",
    "opt_details_desc": "Tüm servis kayıtları tarih sıralı",

    "preview": "Önizleme",
    "records_count": "{{c}} kayıt",
    "tot_spent": "Toplam Harcama",
    "fuel_spent": "Yakıt Gideri",
    "maint_spent": "Bakım Gideri",
    "cost_per_km": "Km / Maliyet",
    "avg_cons": "Ortalama tüketim:",

    "generating": "PDF oluşturuluyor...",
    "download": "PDF Raporu İndir",
    "empty_msg": "Bu araç ve dönem için kayıt bulunamadı.",

    "pdf_content_title": "PDF Rapor İçeriği",
    "pdf_c1": "Kapak sayfası — araç bilgileri ve rapor özeti",
    "pdf_c2": "Bakım türlerine göre harcama dağılım tablosu",
    "pdf_c3": "Aylık harcama özet tablosu",
    "pdf_c4": "Detaylı servis kayıtları (tarih, tür, km, tutar, not)",
    "pdf_c5": "Km başı maliyet ve yakıt tüketim analizi",

    // PDF generator texts
    "pdf_header": "CarSync Pro — Servis Geçmişi Raporu",
    "pdf_brand": "CARSYNC PRO",
    "pdf_sys": "Araç Yönetim Sistemi",
    "pdf_r1": "Servis Geçmişi",
    "pdf_r2": "Raporu",
    "pdf_health": "SAĞLIK",
    "pdf_date": "Rapor Tarihi",
    "pdf_period": "Dönem",
    "pdf_tot_log": "Toplam Kayıt",
    "pdf_created": "Oluşturulma",

    "pdf_sum_title": "Özet İstatistikler",
    "pdf_unit_count": "adet",
    "pdf_unit_times": "kez",
    "pdf_avg_cons": "Ortalama Yakıt Tüketimi:",

    "pdf_type_title": "Bakım Türlerine Göre Dağılım",
    "pdf_t_type": "Bakım Türü",
    "pdf_t_count": "Adet",
    "pdf_t_tot": "Toplam Tutar",
    "pdf_t_ratio": "Oran",

    "pdf_mo_title": "Aylık Harcama Özeti",
    "pdf_t_mo": "Ay",
    "pdf_t_rec": "Kayıt",
    "pdf_t_fuel": "Yakıt",
    "pdf_t_maint": "Bakım",

    "pdf_det_title": "Detaylı Servis Kayıtları",
    "pdf_t_date": "Tarih",
    "pdf_t_km": "Kilometre",
    "pdf_t_L": "Litre",
    "pdf_t_cost": "Tutar",
    "pdf_t_note": "Not",

    "pdf_page": "Sayfa"
};

enData.report = {
    // Types
    "log_fuel": "Fuel Purchase",
    "log_oil": "Oil Change",
    "log_periodic": "Periodic Maintenance",
    "log_tire_change": "Tire Change",
    "log_tire_rot": "Tire Rotation",
    "log_brake": "Brake Service",
    "log_battery": "Battery Change",
    "log_inspection": "Inspection",
    "log_wash": "Wash & Detail",

    "range_3m": "3M", "range_6m": "6M", "range_1y": "1Y", "range_2y": "2Y", "range_all": "All",

    "loading": "Loading...",
    "title": "PDF Report",
    "subtitle": "Service history & financial analysis",
    "pdf": "PDF",
    "vehicle": "Vehicle",
    "date_range": "Date Range",
    "report_content": "Report Content",

    "opt_summary": "Summary Statistics",
    "opt_summary_desc": "Total expense, km analysis, fuel consumption",
    "opt_details": "Detailed Record Table",
    "opt_details_desc": "All service records sorted by date",

    "preview": "Preview",
    "records_count": "{{c}} records",
    "tot_spent": "Total Spent",
    "fuel_spent": "Fuel Expense",
    "maint_spent": "Maintenance",
    "cost_per_km": "Cost / Km",
    "avg_cons": "Avg consumption:",

    "generating": "Generating PDF...",
    "download": "Download PDF Report",
    "empty_msg": "No records found for this vehicle and period.",

    "pdf_content_title": "PDF Report Content",
    "pdf_c1": "Cover page — vehicle info and report summary",
    "pdf_c2": "Expense distribution table by maintenance type",
    "pdf_c3": "Monthly expense summary table",
    "pdf_c4": "Detailed service records (date, type, km, amount, note)",
    "pdf_c5": "Cost per km and fuel consumption analysis",

    "pdf_header": "CarSync Pro — Service History Report",
    "pdf_brand": "CARSYNC PRO",
    "pdf_sys": "Vehicle Management System",
    "pdf_r1": "Service History",
    "pdf_r2": "Report",
    "pdf_health": "HEALTH",
    "pdf_date": "Report Date",
    "pdf_period": "Period",
    "pdf_tot_log": "Total Records",
    "pdf_created": "Created",

    "pdf_sum_title": "Summary Statistics",
    "pdf_unit_count": "items",
    "pdf_unit_times": "times",
    "pdf_avg_cons": "Average Fuel Consumption:",

    "pdf_type_title": "Distribution by Maintenance Type",
    "pdf_t_type": "Maint. Type",
    "pdf_t_count": "Count",
    "pdf_t_tot": "Total Amount",
    "pdf_t_ratio": "Ratio",

    "pdf_mo_title": "Monthly Expense Summary",
    "pdf_t_mo": "Month",
    "pdf_t_rec": "Record",
    "pdf_t_fuel": "Fuel",
    "pdf_t_maint": "Maint.",

    "pdf_det_title": "Detailed Service Records",
    "pdf_t_date": "Date",
    "pdf_t_km": "Mileage",
    "pdf_t_L": "Liters",
    "pdf_t_cost": "Amount",
    "pdf_t_note": "Note",

    "pdf_page": "Page"
};

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

// 2. Update ServiceHistoryReport.tsx
let content = fs.readFileSync('pages/ServiceHistoryReport.tsx', 'utf8');

if (!content.includes('useTranslation')) {
    content = content.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}

// 1. Types dict replacing string
// We cannot dynamically generate object keys with t in LOG_META outside component,
// so let's keep LOG_META keys as tr keys (which match ServiceLog.type), but we will translate them when displaying.
// We just need to translate l.type when generating PDF or UI.
// Actually `type` field in DB is hardcoded TR. We handle UI translation elsewhere.

// 2. Add 't' to generatePDF signature
content = content.replace(
    "const generatePDF = (vehicle: Vehicle, logs: ServiceLog[], stats: ReportStats, config: ReportConfig) => {",
    "const generatePDF = (vehicle: Vehicle, logs: ServiceLog[], stats: ReportStats, config: ReportConfig, t: any) => {"
);

// 3. String replacements inside generatePDF
const pdfStrReps = [
    ["'CarSync Pro — Servis Geçmişi Raporu'", "t('report.pdf_header')"],
    ["'Araç Yönetim Sistemi'", "t('report.pdf_sys')"],
    ["'Servis Geçmişi'", "t('report.pdf_r1')"],
    ["'Raporu'", "t('report.pdf_r2')"],
    ["'SAĞLIK'", "t('report.pdf_health')"],
    ["`Rapor Tarihi: ${now.getDate()} ${MONTHS_TR[now.getMonth()]} ${now.getFullYear()}`", "`${t('report.pdf_date')}: ${now.getDate()} ${t('smart_notifs.months', { returnObjects: true })[now.getMonth()]} ${now.getFullYear()}`"],
    ["`Dönem: ${config.dateRange}  •  Toplam Kayıt: ${stats.totalLogs}`", "`${t('report.pdf_period')}: ${config.dateRange === 'Tümü' ? t('report.range_all') : config.dateRange}  •  ${t('report.pdf_tot_log')}: ${stats.totalLogs}`"],
    ["`Oluşturulma: ${now.toLocaleTimeString('tr-TR')}`", "`${t('report.pdf_created')}: ${now.toLocaleTimeString(t('common.locale', { defaultValue: 'tr-TR' }))}`"],
    ["'Özet İstatistikler'", "t('report.pdf_sum_title')"],
    ["['Toplam Harcama',", "[t('report.tot_spent'),"],
    ["['Yakıt Gideri',", "[t('report.fuel_spent'),"],
    ["['Bakım Gideri',", "[t('report.maint_spent'),"],
    ["['Toplam Kayıt',", "[t('report.pdf_tot_log'),"],
    ["`${stats.totalLogs} adet`", "`${stats.totalLogs} ${t('report.pdf_unit_count')}`"],
    ["['Yakıt Dolumu',", "[t('report.log_fuel'),"],
    ["`${stats.fuelLogs} kez / ${stats.totalLiters.toFixed(1)} L`", "`${stats.fuelLogs} ${t('report.pdf_unit_times')} / ${stats.totalLiters.toFixed(1)} L`"],
    ["['Km Başı Maliyet',", "[t('report.cost_per_km'),"],
    ["`Ortalama Yakıt Tüketimi: ${stats.avgConsumption} L/100km`", "`${t('report.pdf_avg_cons')} ${stats.avgConsumption} L/100km`"],
    ["'Bakım Türlerine Göre Dağılım'", "t('report.pdf_type_title')"],
    ["type,", "t(`add_record.type_\${type.replace(/\\\\s|[&]/g,'').toLowerCase()}`, { defaultValue: type }),"], // Translate log type
    ["[['Bakım Türü', 'Adet', 'Toplam Tutar', 'Oran']]", "[[t('report.pdf_t_type'), t('report.pdf_t_count'), t('report.pdf_t_tot'), t('report.pdf_t_ratio')]]"],
    ["'Aylık Harcama Özeti'", "t('report.pdf_mo_title')"],
    ["`${MONTHS_TR[Number(mo)-1]} ${yr}`", "`${t('smart_notifs.months', { returnObjects: true })[Number(mo)-1]} ${yr}`"],
    ["[['Ay', 'Kayıt', 'Yakıt', 'Bakım', 'Toplam']]", "[[t('report.pdf_t_mo'), t('report.pdf_t_rec'), t('report.pdf_t_fuel'), t('report.pdf_t_maint'), t('report.pdf_t_tot')]]"],
    ["'Detaylı Servis Kayıtları'", "t('report.pdf_det_title')"],
    ["l.type,", "t(`add_record.type_\${l.type.replace(/\\\\s|[&]/g,'').toLowerCase()}`, { defaultValue: l.type }),"],
    ["[['Tarih', 'Tür', 'Kilometre', 'Litre', 'Tutar', 'Not']]", "[[t('report.pdf_t_date'), t('report.pdf_t_type'), t('report.pdf_t_km'), t('report.pdf_t_L'), t('report.pdf_t_cost'), t('report.pdf_t_note')]]"],
    ["'CarSync Pro • Araç Yönetim Sistemi'", "t('report.pdf_header')"],
    ["`Sayfa ${i} / ${pageCount}`", "`${t('report.pdf_page')} ${i} / ${pageCount}`"],
    ["`Oluşturulma: ${now.toLocaleDateString('tr-TR')}`", "`${t('report.pdf_created')}: ${now.toLocaleDateString(t('common.locale', { defaultValue: 'tr-TR' }))}`"],
];

for (const [s, r] of pdfStrReps) {
    if (content.includes(s)) content = content.split(s).join(r);
}

// Ensure the helper 'formatDate' inside 'generatePDF' uses 't' properly... actually formatDate in ServiceHistoryReport is outside generatePDF.
content = content.replace("const formatDate = (dateStr: string) => {", "const formatDate = (dateStr: string, t: any) => {");
content = content.replace("return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;", "const months = t('smart_notifs.months', { returnObjects: true }) as string[];\n  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;");
// Fix usage in generatePDF
content = content.replace("formatDate(l.date),", "formatDate(l.date, t),");

// 4. Main component UI texts
content = content.replace(
    "export const ServiceHistoryReport: React.FC = () => {\n  const navigate = useNavigate();",
    "export const ServiceHistoryReport: React.FC = () => {\n  const navigate = useNavigate();\n  const { t } = useTranslation();"
);

// handleGenerate with 't'
content = content.replace("generatePDF(selectedVehicle, logs, stats, config);", "generatePDF(selectedVehicle, logs, stats, config, t);");

const mainStrReps = [
    [">Yükleniyor...</p>", ">{t('report.loading')}</p>"],
    [">PDF Rapor</h1>", ">{t('report.title')}</h1>"],
    [">Servis geçmişi & finansal analiz</p>", ">{t('report.subtitle')}</p>"],
    [">PDF</span>", ">{t('report.pdf')}</span>"],
    [">Araç</label>", ">{t('report.vehicle')}</label>"],
    [">Tarih Aralığı</label>", ">{t('report.date_range')}</label>"],

    // date range map
    ["{(['3A','6A','1Y','2Y','Tümü'] as DateRange[]).map(r => (", "{(['3A','6A','1Y','2Y','Tümü'] as DateRange[]).map(r => { const mapped = r === '3A' ? 'range_3m' : r === '6A' ? 'range_6m' : r === '1Y' ? 'range_1y' : r === '2Y' ? 'range_2y' : 'range_all'; return ( "],
    ["{r}\n              </button>", "{t('report.' + mapped)}\n              </button>"],
    ["))} \n          </div>", ")})}\n          </div>"], // fix syntax if regex fails, wait!
];

for (const [s, r] of mainStrReps) {
    if (content.includes(s)) content = content.split(s).join(r);
}

// Special care for date ranges logic replacement
content = content.replace(
    "{(['3A','6A','1Y','2Y','Tümü'] as DateRange[]).map(r => (",
    "{(['3A','6A','1Y','2Y','Tümü'] as DateRange[]).map(r => {"
);
content = content.replace(
    `                {r}
              </button>
            ))}
          </div>`,
    `                {r === '3A' ? t('report.range_3m') : r === '6A' ? t('report.range_6m') : r === '1Y' ? t('report.range_1y') : r === '2Y' ? t('report.range_2y') : t('report.range_all')}
              </button>
            )})}
          </div>`
);

// Report options mapping
const oldRepOpts = `[
              { key: 'includeSummary',     label: 'Özet İstatistikler',   desc: 'Toplam harcama, km analizi, yakıt tüketimi' },
              { key: 'includeLogDetails',  label: 'Detaylı Kayıt Tablosu', desc: 'Tüm servis kayıtları tarih sıralı' },
            ]`;
const newRepOpts = `[
              { key: 'includeSummary',     label: t('report.opt_summary'),   desc: t('report.opt_summary_desc') },
              { key: 'includeLogDetails',  label: t('report.opt_details'), desc: t('report.opt_details_desc') },
            ]`;
content = content.replace(oldRepOpts, newRepOpts);
content = content.replace(">Rapor İçeriği</label>", ">{t('report.report_content')}</label>");

// Preview blocks
content = content.replace(">Önizleme</p>", ">{t('report.preview')}</p>");
content = content.replace("· {stats.totalLogs} kayıt", "· {t('report.records_count', { c: stats.totalLogs })}");

const oldStatBlock = `[
                { label: 'Toplam Harcama', value: \`₺\${stats.totalCost.toLocaleString('tr-TR')}\`, color: 'text-indigo-400' },
                { label: 'Yakıt Gideri',   value: \`₺\${stats.fuelCost.toLocaleString('tr-TR')}\`,  color: 'text-blue-400'   },
                { label: 'Bakım Gideri',   value: \`₺\${stats.maintenanceCost.toLocaleString('tr-TR')}\`, color: 'text-amber-400' },
                { label: 'Km / Maliyet',   value: stats.costPerKm > 0 ? \`₺\${stats.costPerKm}/km\` : '—', color: 'text-emerald-400' },
              ]`;
const newStatBlock = `[
                { label: t('report.tot_spent'), value: \`₺\${stats.totalCost.toLocaleString('tr-TR')}\`, color: 'text-indigo-400' },
                { label: t('report.fuel_spent'),   value: \`₺\${stats.fuelCost.toLocaleString('tr-TR')}\`,  color: 'text-blue-400'   },
                { label: t('report.maint_spent'),   value: \`₺\${stats.maintenanceCost.toLocaleString('tr-TR')}\`, color: 'text-amber-400' },
                { label: t('report.cost_per_km'),   value: stats.costPerKm > 0 ? \`₺\${stats.costPerKm}/km\` : '—', color: 'text-emerald-400' },
              ]`;
content = content.replace(oldStatBlock, newStatBlock);

content = content.replace(">Ortalama tüketim:</span>", ">{t('report.avg_cons')}</span>");

content = content.replace("PDF oluşturuluyor...</>", ">{t('report.generating')}</>");
content = content.replace("PDF Raporu İndir</>", ">{t('report.download')}</>");
content = content.replace(">Bu araç ve dönem için kayıt bulunamadı.</p>", ">{t('report.empty_msg')}</p>");
content = content.replace(">PDF Rapor İçeriği</p>", ">{t('report.pdf_content_title')}</p>");

const oldContentOpts = `[
            { icon: FileText,    text: 'Kapak sayfası — araç bilgileri ve rapor özeti' },
            { icon: BarChart2,   text: 'Bakım türlerine göre harcama dağılım tablosu' },
            { icon: Calendar,    text: 'Aylık harcama özet tablosu' },
            { icon: Wrench,      text: 'Detaylı servis kayıtları (tarih, tür, km, tutar, not)' },
            { icon: TrendingUp,  text: 'Km başı maliyet ve yakıt tüketim analizi' },
          ]`;
const newContentOpts = `[
            { icon: FileText,    text: t('report.pdf_c1') },
            { icon: BarChart2,   text: t('report.pdf_c2') },
            { icon: Calendar,    text: t('report.pdf_c3') },
            { icon: Wrench,      text: t('report.pdf_c4') },
            { icon: TrendingUp,  text: t('report.pdf_c5') },
          ]`;
content = content.replace(oldContentOpts, newContentOpts);

fs.writeFileSync('pages/ServiceHistoryReport.tsx', content);
console.log('ServiceHistoryReport translated!');
