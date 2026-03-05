const fs = require('fs');

// 1. Update Translations
const trPath = 'src/locales/tr/translation.json';
const enPath = 'src/locales/en/translation.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

trData.fuel = {
    "fuel_95": "Benzin 95",
    "fuel_97": "Benzin 97",
    "fuel_diesel": "Motorin",
    "fuel_lpg": "LPG",
    "open_now": "Açık",
    "closed": "Kapalı",
    "cheapest": "En Ucuz",
    "no_price": "Fiyat Yok",
    "per_liter": "/litre",
    "directions": "Yol Tarifi",
    "report_price": "Fiyat Bildir",
    "report_title": "Fiyat Bildir",
    "liter_price": "Litre Fiyatı (₺)",
    "price_ph": "örn: 42.80",
    "save": "Kaydet",
    "title": "Yakıt Bulucu",
    "subtitle_loc": "Konumunuza göre istasyonlar",
    "subtitle_near": "En yakın yakıt istasyonları",
    "loc_err": "Konum alınamadı. Lütfen tarayıcı izinlerini kontrol edin.",
    "demo_data": "Demo verileri gösteriliyor.",
    "stations_count": "İstasyon",
    "avg_price": "Ort. Fiyat",
    "sort_dist": "📍 Mesafe",
    "sort_price": "💰 Fiyat",
    "sort_rating": "⭐ Puan",
    "filter_open": "Açık",
    "searching": "İstasyonlar aranıyor...",
    "real_prices_title": "Gerçek Fiyatlar İçin",
    "real_prices_desc": "Gerçek fiyat verisi için <1>VITE_GOOGLE_MAPS_API_KEY</1> ortam değişkenini ayarlayın ya da istasyonlarda <2>Fiyat Bildir</2> butonuyla topluluk fiyatları oluşturun."
};

enData.fuel = {
    "fuel_95": "Gasoline 95",
    "fuel_97": "Gasoline 97",
    "fuel_diesel": "Diesel",
    "fuel_lpg": "LPG",
    "open_now": "Open",
    "closed": "Closed",
    "cheapest": "Cheapest",
    "no_price": "No Price",
    "per_liter": "/liter",
    "directions": "Directions",
    "report_price": "Report Price",
    "report_title": "Report Price",
    "liter_price": "Price per Liter",
    "price_ph": "e.g., 42.80",
    "save": "Save",
    "title": "Fuel Finder",
    "subtitle_loc": "Stations based on your location",
    "subtitle_near": "Nearest fuel stations",
    "loc_err": "Could not get location. Please check browser permissions.",
    "demo_data": "Showing demo data.",
    "stations_count": "Stations",
    "avg_price": "Avg. Price",
    "sort_dist": "📍 Distance",
    "sort_price": "💰 Price",
    "sort_rating": "⭐ Rating",
    "filter_open": "Open",
    "searching": "Searching stations...",
    "real_prices_title": "For Real Prices",
    "real_prices_desc": "Set the <1>VITE_GOOGLE_MAPS_API_KEY</1> environment variable for real price data, or generate community prices using the <2>Report Price</2> button at stations."
};

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

// 2. Update FuelFinder.tsx
let content = fs.readFileSync('pages/FuelFinder.tsx', 'utf8');

if (!content.includes('import { useTranslation }')) {
    content = content.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation, Trans } from 'react-i18next';"
    );
}

// Convert FUEL_LABELS to dynamic. We can't translate outside component easily
// unless we change its shape or use hook inside.
// Instead of full object, we provide keys.
content = content.replace(
    "gasoline95: { label: 'Benzin 95',  color: 'text-green-400',  icon: Fuel    },",
    "gasoline95: { labelKey: 'fuel_95',  color: 'text-green-400',  icon: Fuel    },"
);
content = content.replace(
    "gasoline97: { label: 'Benzin 97',  color: 'text-emerald-400',icon: Fuel    },",
    "gasoline97: { labelKey: 'fuel_97',  color: 'text-emerald-400',icon: Fuel    },"
);
content = content.replace(
    "diesel:     { label: 'Motorin',    color: 'text-amber-400',  icon: Droplet },",
    "diesel:     { labelKey: 'fuel_diesel',    color: 'text-amber-400',  icon: Droplet },"
);
content = content.replace(
    "lpg:        { label: 'LPG',        color: 'text-blue-400',   icon: Zap     },",
    "lpg:        { labelKey: 'fuel_lpg',        color: 'text-blue-400',   icon: Zap     },"
);

// Fuel tabs
content = content.replace(
    "{meta.label}",
    "{t(`fuel.${meta.labelKey}`)}"
);
// In Expanded view for fuels
content = content.replace(
    "<span className=\"text-slate-400 text-xs\">{meta.label}</span>",
    "<span className=\"text-slate-400 text-xs\">{t(`fuel.${meta.labelKey}`)}</span>"
);

// To translate things inside subcomponents, we'll give them the 't' function.
// Fuel Finder has StationCard and PriceReportModal
// Both are defined outside FuelFinder. We can either pass t or use useTranslation inside them.

content = content.replace(
    "const StationCard: React.FC<{",
    "const StationCard: React.FC<{\n  t: any;"
);
content = content.replace(
    "const PriceReportModal: React.FC<{",
    "const PriceReportModal: React.FC<{\n  t: any;"
);

// Pass it down
content = content.replace(
    "onPriceReport={setReportingStation}",
    "onPriceReport={setReportingStation}\n                t={t}"
);
content = content.replace(
    "onSave={handlePriceSave}",
    "onSave={handlePriceSave}\n          t={t}"
);

// Main hook
content = content.replace(
    "export const FuelFinder: React.FC = () => {\n  const navigate = useNavigate();",
    "export const FuelFinder: React.FC = () => {\n  const navigate = useNavigate();\n  const { t } = useTranslation();"
);

// Modal translations
content = content.replace(">Fiyat Bildir</h3>", ">{t('fuel.report_title')}</h3>");
content = content.replace(">Litre Fiyatı (₺)</label>", ">{t('fuel.liter_price')}</label>");
content = content.replace("placeholder=\"örn: 42.80\"", "placeholder={t('fuel.price_ph')}");
content = content.replace(">Kaydet<", ">{t('fuel.save')}<");
content = content.replace("{meta.label}", "{t(`fuel.${meta.labelKey}`)}");

// Card translations
content = content.replace(">\n                  En Ucuz\n                </span>", ">\n                  {t('fuel.cheapest')}\n                </span>");
content = content.replace("{station.isOpen ? 'Açık' : 'Kapalı'}", "{station.isOpen ? t('fuel.open_now') : t('fuel.closed')}");
content = content.replace(">Fiyat Yok</p>", ">{t('fuel.no_price')}</p>");
content = content.replace(">/litre</p>", ">{t('fuel.per_liter')}</p>");
content = content.replace(">\n              Yol Tarifi\n            </button>", ">\n              {t('fuel.directions')}\n            </button>");
content = content.replace(">\n              Fiyat Bildir\n            </button>", ">\n              {t('fuel.report_price')}\n            </button>");

// Component body translations
content = content.replace(">'Konum alınamadı. Lütfen tarayıcı izinlerini kontrol edin.'", ">t('fuel.loc_err')");
content = content.replace(">Yakıt Bulucu<", ">{t('fuel.title')}<");
content = content.replace("location ? 'Konumunuza göre istasyonlar' : 'En yakın yakıt istasyonları'", "location ? t('fuel.subtitle_loc') : t('fuel.subtitle_near')");
content = content.replace("> Demo verileri gösteriliyor.</p>", "> {t('fuel.demo_data')}</p>");
content = content.replace(">İstasyon</p>", ">{t('fuel.stations_count')}</p>");
content = content.replace(">En Ucuz</p>", ">{t('fuel.cheapest')}</p>");
content = content.replace(">Ort. Fiyat</p>", ">{t('fuel.avg_price')}</p>");

// Filter buttons array
content = content.replace(
    "              { key: 'distance', label: '📍 Mesafe' },\n              { key: 'price', label: '💰 Fiyat' },\n              { key: 'rating', label: '⭐ Puan' },",
    "              { key: 'distance', label: t('fuel.sort_dist') },\n              { key: 'price', label: t('fuel.sort_price') },\n              { key: 'rating', label: t('fuel.sort_rating') },"
);
content = content.replace(">\n              Açık\n            </button>", ">\n              {t('fuel.filter_open')}\n            </button>");
content = content.replace(">İstasyonlar aranıyor...</p>", ">{t('fuel.searching')}</p>");
content = content.replace(">Gerçek Fiyatlar İçin</p>", ">{t('fuel.real_prices_title')}</p>");

// Info note
const oldNote = `Gerçek fiyat verisi için <span className="text-slate-300 font-medium">VITE_GOOGLE_MAPS_API_KEY</span> ortam değişkenini
              ayarlayın ya da istasyonlarda <span className="text-green-400">"Fiyat Bildir"</span> butonuyla topluluk fiyatları oluşturun.`;
const newNote = `<Trans i18nKey="fuel.real_prices_desc">
              Gerçek fiyat verisi için <span className="text-slate-300 font-medium">VITE_GOOGLE_MAPS_API_KEY</span> ortam değişkenini
              ayarlayın ya da istasyonlarda <span className="text-green-400">Fiyat Bildir</span> butonuyla topluluk fiyatları oluşturun.
            </Trans>`;
content = content.replace(oldNote, newNote);

fs.writeFileSync('pages/FuelFinder.tsx', content);
console.log('FuelFinder translated!');
