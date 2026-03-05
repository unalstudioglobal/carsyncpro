const fs = require('fs');

// 1. Fix FuelFinder.tsx
let fuel = fs.readFileSync('pages/FuelFinder.tsx', 'utf8');

// Fix type
fuel = fuel.replace(
    "Record<FuelType, { label: string; color: string; icon: React.ElementType }>",
    "Record<FuelType, { labelKey: string; color: string; icon: React.ElementType }>"
);

// Fix destructured arguments
fuel = fuel.replace(
    "}> = ({ station, activeFuel, cheapestPrice, onPriceReport }) => {",
    "}> = ({ station, activeFuel, cheapestPrice, onPriceReport, t }) => {"
);
fuel = fuel.replace(
    "}> = ({ stationId, stations, onClose, onSave }) => {",
    "}> = ({ stationId, stations, onClose, onSave, t }) => {"
);

fs.writeFileSync('pages/FuelFinder.tsx', fuel);
console.log('FuelFinder fixed!');

// 2. Fix Logs.tsx
let logs = fs.readFileSync('pages/Logs.tsx', 'utf8');
// Check if t is shadowed
if (logs.includes("serviceTypes.map(t =>")) {
    logs = logs.replace("serviceTypes.map(t =>", "serviceTypes.map(typeStr =>");
    logs = logs.replace("key={t}", "key={typeStr}");
    logs = logs.replace("onClick={() => setSelectedType(t)}", "onClick={() => setSelectedType(typeStr)}");
    logs = logs.replace("selectedType === t", "selectedType === typeStr");
    logs = logs.replace(
        "{t === 'all' ? t('logs.all_types') : t(`add_record.type_${t.replace(/\\s|[&]/g,'').toLowerCase()}`, { defaultValue: t })}",
        "{typeStr === 'all' ? t('logs.all_types') : t(`add_record.type_${typeStr.replace(/\\s|[&]/g,'').toLowerCase()}`, { defaultValue: typeStr })}"
    );
}
// Find if we still have any issue in the button rendering
// We just need to replace the whole line for the button
// `<button  key={typeStr} onClick={() => setSelectedType(typeStr)} className={...}>  {typeStr === 'all' ? t('logs.all_types') : t(\`add_record.type_\${typeStr.replace(/\\s|[&]/g,'').toLowerCase()}\`, { defaultValue: typeStr })} </button>`

fs.writeFileSync('pages/Logs.tsx', logs);
console.log('Logs fixed!');
