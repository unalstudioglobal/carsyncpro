const fs = require('fs');

let content = fs.readFileSync('pages/Dashboard.tsx', 'utf8');

// 1. Add hook import
if (!content.includes("import { useTranslation }")) {
    content = content.replace(
        "import { useParams, useNavigate } from 'react-router-dom';",
        "import { useParams, useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}

// 2. Add hook call
if (!content.includes("const { t } = useTranslation();")) {
    content = content.replace(
        "const navigate = useNavigate();",
        "const { t } = useTranslation();\n  const navigate = useNavigate();"
    );
}

// 3. Replacements
const replacements = [
    ["'Araç geçmişi analiz ediliyor...'", "t('dashboard.analyzing_history')"],
    ["'Periyodik Bakım'", "t('dashboard.periodic_maintenance')"],
    ['"Resimler yüklenirken bir hata oluştu."', "t('dashboard.image_upload_error')"],
    ["'Randevu başarıyla oluşturuldu!'", "t('dashboard.appt_success')"],
    ["'Bu randevuyu iptal etmek istediğinize emin misiniz?'", "t('dashboard.appt_cancel_confirm')"],
    [">Yükleniyor...<", ">{t('dashboard.loading')}<"],
    [">Araç Sağlık Puanı<", ">{t('dashboard.health_score')}<"],
    ['"Mükemmel durumda. Düzenli bakımlara devam edin."', "t('dashboard.health_perfect')"],
    ['"İyi durumda, ancak bazı bakımlar yaklaşıyor."', "t('dashboard.health_good')"],
    ['"Dikkat gerekli. Servis kontrollerini aksatmayın."', "t('dashboard.health_attention')"],
    [">Arıza Tanılama (DTC)<", ">{t('dashboard.dtc_title')}<"],
    [">OBD-II hata kodlarını (örn. P0300) girerek yapay zeka destekli detaylı analiz ve çözüm önerileri alın.<", ">{t('dashboard.dtc_desc')}<"],
    ['"P Kodunu girin"', "t('dashboard.dtc_placeholder')"],
    [">Kod analiz edilemedi. Lütfen kodu kontrol edin veya internet bağlantınızı doğrulayın.<", ">{t('dashboard.dtc_error')}<"],
    [">Olası Nedenler<", ">{t('dashboard.possible_causes')}<"],
    [">Çözüm Önerileri<", ">{t('dashboard.solutions')}<"],
    [">Kilometre<", ">{t('dashboard.mileage')}<"],
    [">Ort. Yakıt<", ">{t('dashboard.avg_fuel')}<"],
    ["'Son 6 Ay'", "t('dashboard.last_6_months')"],
    ["'Veri Yok'", "t('dashboard.no_data')"],
    [">Aylık Harcama<", ">{t('dashboard.monthly_expense')}<"],
    [">Güncel<", ">{t('dashboard.current')}<"],
    [">Yakıt Tüketim Analizi (6 Ay)<", ">{t('dashboard.fuel_analysis')}<"],
    [">Toplam Tüketim<", ">{t('dashboard.total_consumption')}<"],
    [">Mesafe<", ">{t('dashboard.distance')}<"],
    [">Ortalama<", ">{t('dashboard.average')}<"],
    [">*Veriler son 6 aydaki yakıt kayıtlarınıza ve kilometre girişlerinize dayanmaktadır.<", ">{t('dashboard.fuel_disclaimer')}<"],
    [">Son 6 Ay Harcama Özeti<", ">{t('dashboard.expense_summary')}<"],
    ["'Toplam'", "t('dashboard.total')"],
    [">Tahmini Piyasa Değeri<", ">{t('dashboard.market_value')}<"],
    [">Düşük<", ">{t('dashboard.low')}<"],
    [">Ortalama<", ">{t('dashboard.avg')}<"],
    [">Yüksek<", ">{t('dashboard.high')}<"],
    [">Bakım Durumu<", ">{t('dashboard.maintenance_status')}<"],
    [">Takvimi Gör<", ">{t('dashboard.view_calendar')}<"],
    [">Kalan Yağ Ömrü<", ">{t('dashboard.oil_life')}<"],
    [">Kritik Dikkat<", ">{t('dashboard.critical_attention')}<"],
    [">Önerilen Kontroller (YZ)<", ">{t('dashboard.recommended_checks')}<"],
    [">Öneri bulunamadı.<", ">{t('dashboard.no_recommendations')}<"],
    [">Son İşlem<", ">{t('dashboard.last_transaction')}<"],
    [">Yaklaşan Randevular<", ">{t('dashboard.upcoming_appts')}<"],
    [">Son Kayıtlar<", ">{t('dashboard.recent_logs')}<"],
    [">Geçmiş<", ">{t('dashboard.history')}<"],
    [">Yakıt Ekle<", ">{t('dashboard.add_fuel')}<"],
    [">Bakım<", ">{t('dashboard.maintenance')}<"]
];

for (const [search, replace] of replacements) {
    if (content.includes(search)) {
        content = content.split(search).join(replace);
    }
}

fs.writeFileSync('pages/Dashboard.tsx', content);
console.log('Dashboard translated!');
