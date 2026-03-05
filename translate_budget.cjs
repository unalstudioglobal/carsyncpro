const fs = require('fs');

let content = fs.readFileSync('pages/BudgetGoals.tsx', 'utf8');

// 1. Add hook import
if (!content.includes("import { useTranslation }")) {
    content = content.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}

// 2. Add hook call in BudgetCard
if (!content.includes("const { t } = useTranslation(); // In BudgetCard")) {
    content = content.replace(
        "const over = remaining < 0;",
        "const over = remaining < 0;\n  const { t } = useTranslation(); // In BudgetCard"
    );
}

// 3. Add hook call in GoalModal
if (!content.includes("const { t } = useTranslation(); // In GoalModal")) {
    content = content.replace(
        "const isValid = limit && !isNaN(Number(limit)) && Number(limit) > 0;",
        "const isValid = limit && !isNaN(Number(limit)) && Number(limit) > 0;\n  const { t } = useTranslation(); // In GoalModal"
    );
}

// 4. Add hook call in BudgetGoals
if (!content.includes("const { t } = useTranslation(); // In BudgetGoals")) {
    content = content.replace(
        "const navigate = useNavigate();",
        "const navigate = useNavigate();\n  const { t } = useTranslation(); // In BudgetGoals"
    );
}

// 5. Provide translation hook for CATEGORY_META outside component - Wait, CATEGORY_META is constant outside.
// Let's replace the usages of meta.label with translation lookups directly in the component, or just translate labels in component.
// meta.label is used in BudgetCard: <p className="text-white font-semibold text-sm">{meta.label}</p>
// Let's change this to: <p className="text-white font-semibold text-sm">{t(`budget.${goal.category}`)}</p>
// wait, "total" category is "budget.total_expense". We can just use a category map in BudgetCard.
content = content.replace(
    "<p className=\"text-white font-semibold text-sm\">{meta.label}</p>",
    "<p className=\"text-white font-semibold text-sm\">{goal.category === 'total' ? t('budget.total_expense') : t(`budget.${goal.category}`)}</p>"
);

// also in Category select buttons in GoalModal
// {meta.label} -> {key === 'total' ? t('budget.total_expense') : t(`budget.${key}`)}
content = content.replace(
    "<CatIcon size={16} className={category === key ? meta.color : 'text-slate-500'} />\n                  {meta.label}",
    "<CatIcon size={16} className={category === key ? meta.color : 'text-slate-500'} />\n                  {key === 'total' ? t('budget.total_expense') : t(`budget.${key}`)}"
);

// tooltip format: formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, meta.label]}
content = content.replace(
    "formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, meta.label]}",
    "formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, goal.category === 'total' ? t('budget.total_expense') : t(`budget.${goal.category}`)]}"
);

// 6. Simple Replacements
const replacements = [
    // BudgetCard
    [">Harcanan<", ">{t('budget.spent')}<"],
    [">Limit<", ">{t('budget.limit')}<"],
    // dynamic strings
    ["`Bütçeyi ₺${Math.abs(remaining).toLocaleString('tr-TR')} aştın`", "t('budget.over_budget', { amount: Math.abs(remaining).toLocaleString('tr-TR') })"],
    ["`₺${remaining.toLocaleString('tr-TR')} kaldı — dikkat et!`", "t('budget.warning_left', { amount: remaining.toLocaleString('tr-TR') })"],
    ["`₺${remaining.toLocaleString('tr-TR')} bütçen kaldı`", "t('budget.remaining', { amount: remaining.toLocaleString('tr-TR') })"],
    [">Son 6 ay trendi<", ">{t('budget.trend_6m')}<"],

    // GoalModal
    ["{editing ? 'Hedefi Düzenle' : 'Yeni Bütçe Hedefi'}", "{editing ? t('budget.edit_goal') : t('budget.new_goal')}"],
    [">Araç<", ">{t('budget.vehicle')}<"],
    [">Tüm Araçlar<", ">{t('budget.all_vehicles')}<"],
    [">Kategori<", ">{t('budget.category')}<"],
    [">Aylık Limit (₺)<", ">{t('budget.monthly_limit')}<"],
    ["{editing ? 'Güncelle' : 'Hedef Oluştur'}", "{editing ? t('budget.update') : t('budget.create_goal')}"],

    // BudgetGoals
    [">Bütçe Hedefleri<", ">{t('budget.title')}<"],
    [">Aylık harcama limitlerini yönet<", ">{t('budget.subtitle')}<"],
    [">Bu ay harcama<", ">{t('budget.this_month_spent')}<"],
    [">Toplam limit<", ">{t('budget.total_limit')}<"],
    ["`${overBudgetCount} aşıldı`", "t('budget.exceeded_count', { count: overBudgetCount })"],
    ["'✓ İyi'", "t('budget.status_good')"],
    [">Durum<", ">{t('budget.status')}<"],
    ["'Bilinmiyor'", "t('budget.unknown')"],
    [">Henüz bütçe hedefi yok<", ">{t('budget.no_goals_title')}<"],
    [">Aylık harcama limitleri belirle, aşım olduğunda uyarı al ve finansal hedeflerine ulaş.<", ">{t('budget.no_goals_desc')}<"],
    [">İlk Hedefi Oluştur<", ">{t('budget.create_first')}<"],
    [">İpuçları<", ">{t('budget.tips_title')}<"],
];

for (const [search, replace] of replacements) {
    if (content.includes(search)) {
        content = content.split(search).join(replace);
    }
}

// 7. Fix tips array
const tipsSearch = `[
              'Yakıt harcamasını takip et, verimli sürüş alışkanlıkları edin.',
              'Bakım bütçesini aşmadan önce periyodik kontrolleri zamanında yap.',
              '"Tüm Araçlar" hedefi oluşturarak toplam aile bütçeni yönet.',
            ].map`;
const tipsReplace = `(t('budget.tips', { returnObjects: true }) as string[]).map`;
if (content.includes(tipsSearch)) {
    content = content.replace(tipsSearch, tipsReplace);
}

// 8. Fix "Tüm Araçlar" vehicleMap
// m[v.id] = `${v.brand} ${v.model}`; is in useMemo. We need `t` there.
content = content.replace(
    "const m: Record<string, string> = { all: 'Tüm Araçlar' };",
    "const m: Record<string, string> = { all: t('budget.all_vehicles') };"
);

fs.writeFileSync('pages/BudgetGoals.tsx', content);
console.log('BudgetGoals translated!');
