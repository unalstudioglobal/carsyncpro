const fs = require('fs');

// Fix Logs.tsx
let logs = fs.readFileSync('pages/Logs.tsx', 'utf8');
logs = logs.replace("serviceTypes.map(t =>", "serviceTypes.map(typeStr =>");
logs = logs.replace("key={t}", "key={typeStr}");
logs = logs.replace("onClick={() => setSelectedType(t)}", "onClick={() => setSelectedType(typeStr)}");
// {t === 'all' ? t('logs.all_types') : t(`add_record.type_${t.replace(/\\s|[&]/g,'').toLowerCase()}`, { defaultValue: t })}
logs = logs.replace(
    "{t === 'all' ? t('logs.all_types') : t(`add_record.type_${t.replace(/\\s|[&]/g,'').toLowerCase()}`, { defaultValue: t })}",
    "{typeStr === 'all' ? t('logs.all_types') : t(`add_record.type_${typeStr.replace(/\\s|[&]/g,'').toLowerCase()}`, { defaultValue: typeStr })}"
);
logs = logs.replace("selectedType === t", "selectedType === typeStr");

fs.writeFileSync('pages/Logs.tsx', logs);
console.log('Logs.tsx fixed!');

// 1. Update Translations
const trPath = 'src/locales/tr/translation.json';
const enPath = 'src/locales/en/translation.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

trData.trip = {
    "title": "Rota & Yakıt Planlayıcı",
    "distance": "Mesafe (km)",
    "consumption": "Tüketim (L/100km)",
    "price": "Yakıt Fiyatı (TL/L)",
    "calculate": "Hesapla",
    "est_cost": "Tahmini Maliyet",
    "req_fuel": "Gereken Yakıt",
    "per_km": "Km Başına",
    "info": "Mesafe ve yakıt bilgilerini girerek tahmini yolculuk maliyetini hesaplayın."
};

enData.trip = {
    "title": "Trip & Fuel Planner",
    "distance": "Distance (km)",
    "consumption": "Consumption (L/100km)",
    "price": "Fuel Price",
    "calculate": "Calculate",
    "est_cost": "Estimated Cost",
    "req_fuel": "Required Fuel",
    "per_km": "Per Km",
    "info": "Enter distance and fuel details to calculate the estimated trip cost."
};

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

// 2. Update TripPlanner.tsx
let content = fs.readFileSync('pages/TripPlanner.tsx', 'utf8');

if (!content.includes('import { useTranslation }')) {
    content = content.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}
content = content.replace(
    "export const TripPlanner: React.FC = () => {\n  const navigate = useNavigate();",
    "export const TripPlanner: React.FC = () => {\n  const navigate = useNavigate();\n  const { t } = useTranslation();"
);

const rep = [
    [">Rota & Yakıt Planlayıcı<", ">{t('trip.title')}<"],
    ["> Mesafe (km)\n                      </label>", "> {t('trip.distance')}\n                      </label>"],
    ["> Tüketim (L/100km)\n                      </label>", "> {t('trip.consumption')}\n                      </label>"],
    ["> Yakıt Fiyatı (TL/L)\n                      </label>", "> {t('trip.price')}\n                      </label>"],
    [">Hesapla</span>", ">{t('trip.calculate')}</span>"],
    [">Tahmini Maliyet</div>", ">{t('trip.est_cost')}</div>"],
    [">Gereken Yakıt</div>", ">{t('trip.req_fuel')}</div>"],
    [">Km Başına</div>", ">{t('trip.per_km')}</div>"],
    [">Mesafe ve yakıt bilgilerini girerek tahmini yolculuk maliyetini hesaplayın.</p>", ">{t('trip.info')}</p>"]
];

for (const [s, r] of rep) {
    if (content.includes(s)) {
        content = content.split(s).join(r);
    }
}

fs.writeFileSync('pages/TripPlanner.tsx', content);
console.log('TripPlanner translated!');
