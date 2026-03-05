const fs = require('fs');

let content = fs.readFileSync('pages/Analytics.tsx', 'utf8');

// 1. Add hook import
if (!content.includes("import { useTranslation }")) {
    content = content.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}

// 2. Add hook call in Analytics
if (!content.includes("const { t } = useTranslation();")) {
    content = content.replace(
        "const navigate = useNavigate();",
        "const navigate = useNavigate();\n  const { t } = useTranslation();"
    );
}

// Pass t function down where needed
// CustomAreaTooltip
if (!content.includes("const CustomAreaTooltip = ({ active, payload, label, t }: any) => {")) {
    content = content.replace(
        "const CustomAreaTooltip = ({ active, payload, label }: any) => {",
        "const CustomAreaTooltip = ({ active, payload, label, t }: any) => {"
    );
}
// Tooltip usage
content = content.replace(
    "<Tooltip \n                            content={<CustomAreaTooltip />}",
    "<Tooltip \n                            content={<CustomAreaTooltip t={t} />}"
);

// CustomComparisonTooltip don't need translation much, skipping t pass

// Replacements
const rep = [
    // Empty state
    [">Analiz Verisi Yok<", ">{t('analytics.no_data')}<"],
    [">Analizleri görmek için garajınıza araç ekleyin.<", ">{t('analytics.no_data_desc')}<"],
    [">Garaja Git<", ">{t('analytics.go_to_garage')}<"],
    // Headers
    ["{isComparing ? 'Analiz Modu' : (vehicles[0] ? `${vehicles[0].brand} ${vehicles[0].model}` : 'Araç')}", "{isComparing ? t('analytics.analysis_mode') : (vehicles[0] ? `${vehicles[0].brand} ${vehicles[0].model}` : t('analytics.vehicle'))}"],
    ["{isComparing ? 'Karşılaştırma' : 'Finansal Analiz'}", "{isComparing ? t('analytics.comparison') : t('analytics.title')}"],
    // Entry card
    [">Araç Karşılaştırma<", ">{t('analytics.comparison')}<"],
    [">İki aracın yakıt tüketimi, bakım maliyetleri ve sağlık puanlarını yan yana kıyaslayın.<", ">{t('analytics.comparison_desc')}<"],
    ["{isPremium ? 'Karşılaştırmayı Başlat' : 'Özelliği İncele'}", "{isPremium ? t('analytics.start_comparison') : t('analytics.explore_feature')}"],
    // Main Chart
    [">Toplam Harcama ({timeRange})<", ">{t('analytics.total_expense')} ({timeRange})<"],
    [">Yakıt<", ">{t('analytics.fuel')}<"],
    [">Bakım<", ">{t('analytics.maintenance')}<"],
    [">Sigorta<", ">{t('analytics.insurance')}<"],
    [">Diğer<", ">{t('analytics.other')}<"],
    // Stats cards
    [">Seçili dönem toplamı<", ">{t('analytics.expense_period')}<"],
    // Trend
    [">Yakıt Tüketim Trendi (L/100km)<", ">{t('analytics.fuel_trend')}<"],
    // Compare Mode
    [">Araç 1<", ">{t('analytics.v1')}<"],
    [">Araç 2<", ">{t('analytics.v2')}<"],
    ["> Yakıt Tüketimi (L/100km)<", "> {t('analytics.fuel_consumption')}<"],
    [">Aylık Maliyet<", ">{t('analytics.monthly_cost')}<"],
    [">Ortalama<", ">{t('analytics.average')}<"],
    [">Sağlık Puanı<", ">{t('analytics.health_score')}<"],
    ["`${v2.model} %${Math.round((1 - v2Cost/v1Cost)*100)} daha tasarruflu`", "t('analytics.more_efficient', { model: v2.model, percent: Math.round((1 - v2Cost/v1Cost)*100) })"],
    ["`${v1.model} %${Math.round((1 - v1Cost/v2Cost)*100)} daha tasarruflu`", "t('analytics.more_efficient', { model: v1.model, percent: Math.round((1 - v1Cost/v2Cost)*100) })"],
    // Reports Mode
    [">Finansal Raporlar<", ">{t('analytics.report_title')}<"],
    [">Aylık veya yıllık harcama raporlarınızı PDF olarak indirin.<", ">{t('analytics.report_desc')}<"],
    [">Aylık Özet<", ">{t('analytics.monthly_summary')}<"],
    [">Yıllık Rapor<", ">{t('analytics.yearly_report')}<"],
    [">PDF İndir<", ">{t('analytics.download_pdf')}<"],
];

for (const [s, r] of rep) {
    if (content.includes(s)) {
        content = content.split(s).join(r);
    }
}

// Tooltip translation
content = content.replace(
    "<span className=\"text-[10px] text-slate-500 uppercase font-bold\">Toplam Harcama</span>",
    "<span className=\"text-[10px] text-slate-500 uppercase font-bold\">{t ? t('analytics.total_expense') : 'Toplam Harcama'}</span>"
);

// Area names
content = content.replace("name=\"Diğer\"", "name={t('analytics.other')}");
content = content.replace("name=\"Sigorta\"", "name={t('analytics.insurance')}");
content = content.replace("name=\"Bakım\"", "name={t('analytics.maintenance')}");
content = content.replace("name=\"Yakıt\"", "name={t('analytics.fuel')}");

fs.writeFileSync('pages/Analytics.tsx', content);
console.log('Analytics translated!');
