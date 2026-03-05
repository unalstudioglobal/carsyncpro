const fs = require('fs');

// 1. Update Translations
const trPath = 'src/locales/tr/translation.json';
const enPath = 'src/locales/en/translation.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

trData.theme = {
    // Accents
    "acc_indigo": "İndigo", "acc_blue": "Mavi", "acc_violet": "Violet",
    "acc_emerald": "Yeşil", "acc_rose": "Pembe", "acc_amber": "Turuncu", "acc_cyan": "Cyan",

    // Themes
    "thm_dark": "Gece Mavisi", "thm_dark_desc": "Varsayılan koyu tema",
    "thm_midnight": "Gece Yarısı", "thm_midnight_desc": "En koyu, göz yormaz",
    "thm_slate": "Çelik Gri", "thm_slate_desc": "Hafif aydınlık koyu",
    "thm_carbon": "Karbon", "thm_carbon_desc": "Saf siyah zemin",

    // Fonts
    "font_small": "Küçük", "font_medium": "Normal", "font_large": "Büyük",

    // Card Styles
    "card_rounded": "Yuvarlak", "card_sharp": "Köşeli", "card_minimal": "Minimal",

    // Layout
    "lay_grid": "Grid", "lay_list": "Liste", "lay_compact": "Kompakt",

    // Preview
    "prev_add": "Kayıt Ekle",
    "prev_this_month": "bu ay",
    "prev_record": "kayıt",

    // UI
    "title": "Tema & Özelleştirme",
    "subtitle": "Uygulamayı kişiselleştir",
    "reset": "Sıfırla",
    "preview": "Canlı Önizleme",
    "sec_theme": "Uygulama Teması",
    "sec_accent": "Vurgu Rengi",
    "sec_font": "Yazı Boyutu",
    "sec_card": "Kart Stili",
    "sec_layout": "Dashboard Düzeni",

    // Options
    "sec_display": "Görünüm Seçenekleri",
    "opt_health": "Sağlık Skoru Halkası",
    "opt_health_desc": "Dashboard'da animasyonlu sağlık göstergesi",
    "opt_cost": "Maliyet Trend Grafiği",
    "opt_cost_desc": "Ana ekranda aylık harcama grafiği",
    "opt_header": "Kompakt Header",
    "opt_header_desc": "Daha az yer kaplayan başlık alanı",

    "sec_perf": "Performans & Erişilebilirlik",
    "opt_anim": "Animasyonlar",
    "opt_anim_desc": "Geçiş ve yükleme animasyonlarını etkinleştir",
    "opt_haptic": "Dokunma Geri Bildirimi",
    "opt_haptic_desc": "Butona basıldığında titreşim (desteklenen cihazlarda)",

    // Summary
    "active_settings": "Aktif Ayarlar",
    "lbl_theme": "Tema",
    "lbl_accent": "Vurgu Rengi",
    "lbl_font": "Yazı Boyutu",
    "lbl_card": "Kart Stili",
    "lbl_dash": "Dashboard",

    // Reset
    "reset_title": "Ayarları Sıfırla?",
    "reset_desc": "Tüm tema tercihlerin varsayılana döner.",
    "reset_cancel": "Vazgeç",
    "reset_confirm": "Sıfırla"
};

enData.theme = {
    "acc_indigo": "Indigo", "acc_blue": "Blue", "acc_violet": "Violet",
    "acc_emerald": "Green", "acc_rose": "Pink", "acc_amber": "Orange", "acc_cyan": "Cyan",

    "thm_dark": "Night Blue", "thm_dark_desc": "Default dark theme",
    "thm_midnight": "Midnight", "thm_midnight_desc": "Darkest, easy on eyes",
    "thm_slate": "Slate Gray", "thm_slate_desc": "Slightly light dark",
    "thm_carbon": "Carbon", "thm_carbon_desc": "Pure black background",

    "font_small": "Small", "font_medium": "Normal", "font_large": "Large",

    "card_rounded": "Rounded", "card_sharp": "Sharp", "card_minimal": "Minimal",

    "lay_grid": "Grid", "lay_list": "List", "lay_compact": "Compact",

    "prev_add": "Add Record",
    "prev_this_month": "this month",
    "prev_record": "records",

    "title": "Theme & Customization",
    "subtitle": "Personalize the app",
    "reset": "Reset",
    "preview": "Live Preview",
    "sec_theme": "App Theme",
    "sec_accent": "Accent Color",
    "sec_font": "Font Size",
    "sec_card": "Card Style",
    "sec_layout": "Dashboard Layout",

    "sec_display": "Display Options",
    "opt_health": "Health Score Ring",
    "opt_health_desc": "Animated health indicator on dashboard",
    "opt_cost": "Cost Trend Chart",
    "opt_cost_desc": "Monthly expense chart on main screen",
    "opt_header": "Compact Header",
    "opt_header_desc": "Header area taking up less space",

    "sec_perf": "Performance & Accessibility",
    "opt_anim": "Animations",
    "opt_anim_desc": "Enable transition and loading animations",
    "opt_haptic": "Haptic Feedback",
    "opt_haptic_desc": "Vibration on button press (supported devices)",

    "active_settings": "Active Settings",
    "lbl_theme": "Theme",
    "lbl_accent": "Accent Color",
    "lbl_font": "Font Size",
    "lbl_card": "Card Style",
    "lbl_dash": "Dashboard",

    "reset_title": "Reset Settings?",
    "reset_desc": "All theme preferences will revert to default.",
    "reset_cancel": "Cancel",
    "reset_confirm": "Reset"
};

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

// 2. Update ThemeCustomizer.tsx
let content = fs.readFileSync('pages/ThemeCustomizer.tsx', 'utf8');

if (!content.includes('import { useTranslation }')) {
    content = content.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}

// Pass t to PreviewCard
content = content.replace("const PreviewCard: React.FC = () => {", "const PreviewCard: React.FC<{ t: any }> = ({ t }) => {");

const oldStats = `[['125,400', 'km'], ['₺2,450', 'bu ay'], ['12', 'kayıt']]`;
const newStats = `[['125,400', 'km'], ['₺2,450', t('theme.prev_this_month')], ['12', t('theme.prev_record')]]`;
content = content.replace(oldStats, newStats);
content = content.replace("Kayıt Ekle", "{t('theme.prev_add')}");

// Main UI
content = content.replace(
    "export const ThemeCustomizer: React.FC = () => {\n  const navigate = useNavigate();",
    "export const ThemeCustomizer: React.FC = () => {\n  const navigate = useNavigate();\n  const { t } = useTranslation();"
);

// Map definitions inside component to use t
const oldOpts = `const accentOptions: { key: ColorAccent; label: string }[] = [
    { key: 'indigo',  label: 'İndigo'  },
    { key: 'blue',    label: 'Mavi'    },
    { key: 'violet',  label: 'Violet'  },
    { key: 'emerald', label: 'Yeşil'   },
    { key: 'rose',    label: 'Pembe'   },
    { key: 'amber',   label: 'Turuncu' },
    { key: 'cyan',    label: 'Cyan'    },
  ];

  const themeOptions: { key: AppTheme; label: string; desc: string }[] = [
    { key: 'dark',     label: 'Gece Mavisi', desc: 'Varsayılan koyu tema' },
    { key: 'midnight', label: 'Gece Yarısı', desc: 'En koyu, göz yormaz' },
    { key: 'slate',    label: 'Çelik Gri',   desc: 'Hafif aydınlık koyu' },
    { key: 'carbon',   label: 'Karbon',       desc: 'Saf siyah zemin'     },
  ];

  const fontOptions: { key: FontSize; label: string; preview: string }[] = [
    { key: 'small',  label: 'Küçük',   preview: 'Aa' },
    { key: 'medium', label: 'Normal',  preview: 'Aa' },
    { key: 'large',  label: 'Büyük',   preview: 'Aa' },
  ];

  const cardStyleOptions: { key: CardStyle; label: string; icon: React.ElementType }[] = [
    { key: 'rounded', label: 'Yuvarlak', icon: Circle  },
    { key: 'sharp',   label: 'Köşeli',  icon: Square  },
    { key: 'minimal', label: 'Minimal', icon: Minus   },
  ];

  const dashLayoutOptions: { key: DashLayout; label: string; icon: React.ElementType }[] = [
    { key: 'grid',    label: 'Grid',    icon: Grid3x3     },
    { key: 'list',    label: 'Liste',   icon: List        },
    { key: 'compact', label: 'Kompakt', icon: AlignJustify },
  ];`;

const newOpts = `const accentOptions: { key: ColorAccent; label: string }[] = [
    { key: 'indigo',  label: t('theme.acc_indigo')  },
    { key: 'blue',    label: t('theme.acc_blue')  },
    { key: 'violet',  label: t('theme.acc_violet')  },
    { key: 'emerald', label: t('theme.acc_emerald') },
    { key: 'rose',    label: t('theme.acc_rose') },
    { key: 'amber',   label: t('theme.acc_amber') },
    { key: 'cyan',    label: t('theme.acc_cyan') },
  ];

  const themeOptions: { key: AppTheme; label: string; desc: string }[] = [
    { key: 'dark',     label: t('theme.thm_dark'), desc: t('theme.thm_dark_desc') },
    { key: 'midnight', label: t('theme.thm_midnight'), desc: t('theme.thm_midnight_desc') },
    { key: 'slate',    label: t('theme.thm_slate'),   desc: t('theme.thm_slate_desc') },
    { key: 'carbon',   label: t('theme.thm_carbon'),  desc: t('theme.thm_carbon_desc') },
  ];

  const fontOptions: { key: FontSize; label: string; preview: string }[] = [
    { key: 'small',  label: t('theme.font_small'),   preview: 'Aa' },
    { key: 'medium', label: t('theme.font_medium'),  preview: 'Aa' },
    { key: 'large',  label: t('theme.font_large'),   preview: 'Aa' },
  ];

  const cardStyleOptions: { key: CardStyle; label: string; icon: React.ElementType }[] = [
    { key: 'rounded', label: t('theme.card_rounded'), icon: Circle  },
    { key: 'sharp',   label: t('theme.card_sharp'),  icon: Square  },
    { key: 'minimal', label: t('theme.card_minimal'), icon: Minus   },
  ];

  const dashLayoutOptions: { key: DashLayout; label: string; icon: React.ElementType }[] = [
    { key: 'grid',    label: t('theme.lay_grid'),    icon: Grid3x3     },
    { key: 'list',    label: t('theme.lay_list'),   icon: List        },
    { key: 'compact', label: t('theme.lay_compact'), icon: AlignJustify },
  ];`;
content = content.replace(oldOpts, newOpts);


// Rendered Texts
content = content.replace(">Tema & Özelleştirme</h1>", ">{t('theme.title')}</h1>");
content = content.replace(">Uygulamayı kişiselleştir</p>", ">{t('theme.subtitle')}</p>");
content = content.replace("Sıfırla\n          </button>", "{t('theme.reset')}\n          </button>");

content = content.replace(">Canlı Önizleme</p>", ">{t('theme.preview')}</p>");
content = content.replace("<PreviewCard />", "<PreviewCard t={t} />");

content = content.replace("title=\"Uygulama Teması\"", "title={t('theme.sec_theme')}");
content = content.replace("title=\"Vurgu Rengi\"", "title={t('theme.sec_accent')}");
content = content.replace("title=\"Yazı Boyutu\"", "title={t('theme.sec_font')}");
content = content.replace("title=\"Kart Stili\"", "title={t('theme.sec_card')}");
content = content.replace("title=\"Dashboard Düzeni\"", "title={t('theme.sec_layout')}");

content = content.replace("title=\"Görünüm Seçenekleri\"", "title={t('theme.sec_display')}");
content = content.replace("label=\"Sağlık Skoru Halkası\"", "label={t('theme.opt_health')}");
content = content.replace("description=\"Dashboard'da animasyonlu sağlık göstergesi\"", "description={t('theme.opt_health_desc')}");
content = content.replace("label=\"Maliyet Trend Grafiği\"", "label={t('theme.opt_cost')}");
content = content.replace("description=\"Ana ekranda aylık harcama grafiği\"", "description={t('theme.opt_cost_desc')}");
content = content.replace("label=\"Kompakt Header\"", "label={t('theme.opt_header')}");
content = content.replace("description=\"Daha az yer kaplayan başlık alanı\"", "description={t('theme.opt_header_desc')}");

content = content.replace("title=\"Performans & Erişilebilirlik\"", "title={t('theme.sec_perf')}");
content = content.replace("label=\"Animasyonlar\"", "label={t('theme.opt_anim')}");
content = content.replace("description=\"Geçiş ve yükleme animasyonlarını etkinleştir\"", "description={t('theme.opt_anim_desc')}");
content = content.replace("label=\"Dokunma Geri Bildirimi\"", "label={t('theme.opt_haptic')}");
content = content.replace("description=\"Butona basıldığında titreşim (desteklenen cihazlarda)\"", "description={t('theme.opt_haptic_desc')}");

content = content.replace(">Aktif Ayarlar</p>", ">{t('theme.active_settings')}</p>");

const oldActive = `['Tema',         THEME_VARS[config.appTheme].label ?? config.appTheme],
            ['Vurgu Rengi',  config.colorAccent],
            ['Yazı Boyutu',  config.fontSize === 'small' ? 'Küçük' : config.fontSize === 'medium' ? 'Normal' : 'Büyük'],
            ['Kart Stili',   config.cardStyle === 'rounded' ? 'Yuvarlak' : config.cardStyle === 'sharp' ? 'Köşeli' : 'Minimal'],
            ['Dashboard',    config.dashLayout === 'grid' ? 'Grid' : config.dashLayout === 'list' ? 'Liste' : 'Kompakt'],`;

const newActive = `[t('theme.lbl_theme'),         THEME_VARS[config.appTheme].label ?? config.appTheme],
            [t('theme.lbl_accent'),  config.colorAccent],
            [t('theme.lbl_font'),  config.fontSize === 'small' ? t('theme.font_small') : config.fontSize === 'medium' ? t('theme.font_medium') : t('theme.font_large')],
            [t('theme.lbl_card'),   config.cardStyle === 'rounded' ? t('theme.card_rounded') : config.cardStyle === 'sharp' ? t('theme.card_sharp') : t('theme.card_minimal')],
            [t('theme.lbl_dash'),    config.dashLayout === 'grid' ? t('theme.lay_grid') : config.dashLayout === 'list' ? t('theme.lay_list') : t('theme.lay_compact')],`;
content = content.replace(oldActive, newActive);

content = content.replace(">Ayarları Sıfırla?</p>", ">{t('theme.reset_title')}</p>");
content = content.replace(">Tüm tema tercihlerin varsayılana döner.</p>", ">{t('theme.reset_desc')}</p>");
content = content.replace(">\n                Vazgeç\n              </button>", ">\n                {t('theme.reset_cancel')}\n              </button>");
content = content.replace(">\n                Sıfırla\n              </button>", ">\n                {t('theme.reset_confirm')}\n              </button>");

fs.writeFileSync('pages/ThemeCustomizer.tsx', content);
console.log('ThemeCustomizer translated!');
