const fs = require('fs');

const trPath = 'src/locales/tr/translation.json';
const enPath = 'src/locales/en/translation.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

trData.notFound = {
    "title": "Sayfa Bulunamadı",
    "desc": "Aradığınız sayfa mevcut değil veya taşınmış olabilir. Ana sayfaya dönerek devam edebilirsiniz.",
    "btn": "Ana Sayfaya Dön"
};
enData.notFound = {
    "title": "Page Not Found",
    "desc": "The page you are looking for does not exist or may have been moved. You can return to the home page to continue.",
    "btn": "Return to Home Page"
};

trData.login = {
    "subtitle": "Akıllı Garaj Asistanı",
    "email": "E-posta", "email_ph": "ornek@email.com",
    "password": "Şifre",
    "login_btn": "Giriş Yap", "register_btn": "Kayıt Ol",
    "no_account": "Hesabın yok mu?", "has_account": "Zaten hesabın var mı?",
    "or": "VEYA",
    "google_login": "Google ile Devam Et",
    "secure": "Güvenli & Şifreli Bağlantı",

    "err_fill_all": "Lütfen tüm alanları doldurun.",
    "err_inv_cred": "E-posta veya şifre hatalı.",
    "err_in_use": "Bu e-posta zaten kullanımda.",
    "err_weak": "Şifre en az 6 karakter olmalı.",
    "err_inv_email": "Geçersiz e-posta formatı.",
    "err_fail": "Giriş yapılamadı.",
    "err_unauth_domain": "Bu alan adı yetkilendirilmemiş. Lütfen yönetici ile iletişime geçin.",
    "err_google_fail": "Google ile giriş yapılırken bir hata oluştu.",

    "seq_1": "Kullanıcı Doğrulanıyor...",
    "seq_2": "Garaj Verileri Senkronize Ediliyor...",
    "seq_3": "Araç Sağlık Analizi Başlatılıyor...",
    "seq_4": "Sistemler Online. Hoş Geldiniz."
};

enData.login = {
    "subtitle": "Smart Garage Assistant",
    "email": "Email", "email_ph": "example@email.com",
    "password": "Password",
    "login_btn": "Log In", "register_btn": "Sign Up",
    "no_account": "Don't have an account?", "has_account": "Already have an account?",
    "or": "OR",
    "google_login": "Continue with Google",
    "secure": "Secure & Encrypted Connection",

    "err_fill_all": "Please fill in all fields.",
    "err_inv_cred": "Invalid email or password.",
    "err_in_use": "This email is already in use.",
    "err_weak": "Password must be at least 6 characters.",
    "err_inv_email": "Invalid email format.",
    "err_fail": "Login failed.",
    "err_unauth_domain": "Unauthorized domain. Please contact administrator.",
    "err_google_fail": "An error occurred with Google login.",

    "seq_1": "Authenticating User...",
    "seq_2": "Synchronizing Garage Data...",
    "seq_3": "Starting Vehicle Health Analysis...",
    "seq_4": "Systems Online. Welcome."
};

trData.onboarding = {
    "w_tag": "YENİ NESIL ARAÇ YÖNETİMİ",
    "w_welcome": "Pro'ya Hoş Geldin",
    "w_desc": "Aracını takip et, bakımlarını yönet, maliyetlerini analiz et. Her şey tek yerde.",
    "w_btn": "Başlayalım", "w_time": "Kurulum 2 dakikadan az sürer",

    "f_tag": "ÖZELLİKLER", "f_title": "Aracın için her şey",
    "f_1_title": "Akıllı Bakım Takibi", "f_1_desc": "Yağ, lastik, fren — tüm bakımları takip et, zamanı gelmeden uyarı al.",
    "f_2_title": "Finansal Analiz", "f_2_desc": "Aylık harcamalarını gör, bütçe hedefleri belirle, trend grafiklerini incele.",
    "f_3_title": "Yapay Zeka Asistan", "f_3_desc": "Arızaları fotoğraftan tespit et, bakım önerileri al, sorularını sor.",
    "f_4_title": "QR Araç Kartı", "f_4_desc": "Serviste okutun, tüm geçmiş görünsün. Satışta şeffaflık sağla.",
    "f_5_title": "Aile Garajı", "f_5_desc": "Aile veya ekibinle araç verilerini paylaş, herkes kendi rolünde.",
    "f_6_title": "Yakıt Takibi", "f_6_desc": "Menzil tahmini, tüketim trendi, en ucuz istasyon bulma.",
    "f_btn": "İlk Aracımı Ekle",

    "av_1_tag": "1/2 — MARKA", "av_1_title": "Aracının markası nedir?", "av_1_desc": "Hızlıca bir seç veya yazarak ara",
    "av_1_search": "Marka ara veya yaz...", "av_1_btn": "Devam Et",

    "av_2_tag": "2/2 — DETAYLAR", "av_2_title": "{{b}} hakkında birkaç detay",
    "av_l_model": "MODEL *", "av_l_year": "YIL *", "av_l_plate": "PLAKA *", "av_l_mileage": "KİLOMETRE",
    "av_err": "Araç kaydedilemedi. Daha sonra tekrar deneyin.", "av_err_req": "Marka, model ve plaka zorunludur.",
    "av_btn_saving": "Kaydediliyor...", "av_btn_save": "Aracımı Kaydet 🚗",

    "n_tag": "BİLDİRİMLER", "n_title": "Hiçbir bakımı kaçırma", "n_desc": "Önemli tarihleri ve bakım zamanlarını sana hatırlatalım.",
    "n_1_title": "Yağ Değişimi Zamanı", "n_1_desc": "Son değişimden 9.800 km geçti — yakında servis gerekiyor.",
    "n_2_title": "Sigorta Yenileme", "n_2_desc": "Trafik sigortanızın bitimine 14 gün kaldı.",
    "n_3_title": "Servis Randevusu", "n_3_desc": "Yarın saat 10:00 — Oto Servis Kurumsal randevunuz var.",
    "n_btn_req": "İzin bekleniyor...", "n_btn_allow": "Bildirimlere İzin Ver",
    "n_active": "Bildirimler aktif!", "n_denied": "Bildirimler reddedildi. Ayarlardan değiştirebilirsin.",
    "n_next": "Harika, devam et", "n_skip": "Şimdilik geç",
    "n_body": "{{v}} için hatırlatmalar aktif! 🚗",

    "c_title": "Hazırsın! 🎉", "c_added": "{{v}} eklendi",
    "c_desc": "CarSync Pro artık senin. İşte ilk yapabileceğin birkaç şey:",
    "c_1": "İlk bakım kaydını ekle", "c_2": "Analitik sayfasını keşfet", "c_3": "AI asistanına sor",
    "c_btn": "Garaja Git", "skip": "Atla"
};

enData.onboarding = {
    "w_tag": "NEXT GEN VEHICLE MANAGEMENT",
    "w_welcome": "Welcome to Pro",
    "w_desc": "Track your vehicle, manage maintenance, analyze costs. Everything in one place.",
    "w_btn": "Let's Start", "w_time": "Setup takes less than 2 minutes",

    "f_tag": "FEATURES", "f_title": "Everything for your vehicle",
    "f_1_title": "Smart Maintenance Tracking", "f_1_desc": "Track oil, tires, brakes — get warned before it's due.",
    "f_2_title": "Financial Analysis", "f_2_desc": "View monthly expenses, set budget goals, analyze trend graphs.",
    "f_3_title": "AI Assistant", "f_3_desc": "Detect damage from photos, get maintenance tips, ask questions.",
    "f_4_title": "QR Vehicle Card", "f_4_desc": "Scan at service, see full history. Ensure transparency in sales.",
    "f_5_title": "Family Garage", "f_5_desc": "Share vehicle data with family or team, everyone in their role.",
    "f_6_title": "Fuel Tracking", "f_6_desc": "Range estimation, consumption trend, finding cheapest stations.",
    "f_btn": "Add My First Vehicle",

    "av_1_tag": "1/2 — BRAND", "av_1_title": "What's the brand of your vehicle?", "av_1_desc": "Quickly select or type to search",
    "av_1_search": "Search or type brand...", "av_1_btn": "Continue",

    "av_2_tag": "2/2 — DETAILS", "av_2_title": "A few details about {{b}}",
    "av_l_model": "MODEL *", "av_l_year": "YEAR *", "av_l_plate": "LICENSE PLATE *", "av_l_mileage": "MILEAGE",
    "av_err": "Could not save vehicle. Please try again later.", "av_err_req": "Brand, model and plate are required.",
    "av_btn_saving": "Saving...", "av_btn_save": "Save My Vehicle 🚗",

    "n_tag": "NOTIFICATIONS", "n_title": "Never miss maintenance", "n_desc": "Let us remind you of important dates and maintenance times.",
    "n_1_title": "Oil Change Time", "n_1_desc": "9,800 km passed since last change — service needed soon.",
    "n_2_title": "Insurance Renewal", "n_2_desc": "14 days left until your traffic insurance expires.",
    "n_3_title": "Service Appointment", "n_3_desc": "You have an appointment tomorrow at 10:00 — Auto Service Corporate.",
    "n_btn_req": "Waiting for permission...", "n_btn_allow": "Allow Notifications",
    "n_active": "Notifications are active!", "n_denied": "Notifications denied. You can change it in settings.",
    "n_next": "Great, continue", "n_skip": "Skip for now",
    "n_body": "Reminders are active for {{v}}! 🚗",

    "c_title": "You're Set! 🎉", "c_added": "{{v}} added",
    "c_desc": "CarSync Pro is yours now. Here are a few things you can do first:",
    "c_1": "Add first maintenance record", "c_2": "Explore analytics page", "c_3": "Ask AI assistant",
    "c_btn": "Go to Garage", "skip": "Skip"
};

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

// --- NOT FOUND ---
let nf = fs.readFileSync('pages/NotFound.tsx', 'utf8');
if (!nf.includes('useTranslation')) {
    nf = nf.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}
nf = nf.replace("export const NotFound: React.FC = () => {\n    const navigate = useNavigate();", "export const NotFound: React.FC = () => {\n    const navigate = useNavigate();\n    const { t } = useTranslation();");
nf = nf.replace(">Sayfa Bulunamadı\n            </h2>", ">{t('notFound.title')}\n            </h2>");
nf = nf.replace(">Aradığınız sayfa mevcut değil veya taşınmış olabilir. Ana sayfaya dönerek devam edebilirsiniz.\n            </p>", ">{t('notFound.desc')}\n            </p>");
nf = nf.replace(">\n                <ArrowLeft size={16} />\n                Ana Sayfaya Dön\n            </button>", ">\n                <ArrowLeft size={16} />\n                {t('notFound.btn')}\n            </button>");
fs.writeFileSync('pages/NotFound.tsx', nf);

// --- LOGIN ---
let lg = fs.readFileSync('pages/Login.tsx', 'utf8');
if (!lg.includes('useTranslation')) {
    lg = lg.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}

// Pass t to loadingSequence logic, we actually need to replace hardcoded strings with a func or get t from hook.
lg = lg.replace("export const Login: React.FC = () => {\n  const navigate = useNavigate();", "export const Login: React.FC = () => {\n  const navigate = useNavigate();\n  const { t } = useTranslation();");

lg = lg.replace(`  const loadingSequence = [
    "Kullanıcı Doğrulanıyor...",
    "Garaj Verileri Senkronize Ediliyor...",
    "Araç Sağlık Analizi Başlatılıyor...",
    "Sistemler Online. Hoş Geldiniz."
  ];`, `  const loadingSequence = [
    t('login.seq_1'),
    t('login.seq_2'),
    t('login.seq_3'),
    t('login.seq_4')
  ];`);

lg = lg.replace(`setErrorMessage("Lütfen tüm alanları doldurun.");`, `setErrorMessage(t('login.err_fill_all'));`);
lg = lg.replace(`setErrorMessage("E-posta veya şifre hatalı.");`, `setErrorMessage(t('login.err_inv_cred'));`);
lg = lg.replace(`setErrorMessage("Bu e-posta zaten kullanımda.");`, `setErrorMessage(t('login.err_in_use'));`);
lg = lg.replace(`setErrorMessage("Şifre en az 6 karakter olmalı.");`, `setErrorMessage(t('login.err_weak'));`);
lg = lg.replace(`setErrorMessage("Geçersiz e-posta formatı.");`, `setErrorMessage(t('login.err_inv_email'));`);
lg = lg.replace(`setErrorMessage(error.message || "Giriş yapılamadı.");`, `setErrorMessage(error.message || t('login.err_fail'));`);
lg = lg.replace(`setErrorMessage("Bu alan adı yetkilendirilmemiş. Lütfen yönetici ile iletişime geçin.");`, `setErrorMessage(t('login.err_unauth_domain'));`);
lg = lg.replace(`setErrorMessage(error.message || "Google ile giriş yapılırken bir hata oluştu.");`, `setErrorMessage(error.message || t('login.err_google_fail'));`);

lg = lg.replace(`>Akıllı Garaj Asistanı\n            </p>`, `>{t('login.subtitle')}\n            </p>`);

lg = lg.replace(`>E-posta</label>`, `>{t('login.email')}</label>`);
lg = lg.replace(`placeholder="ornek@email.com"`, `placeholder={t('login.email_ph')}`);

lg = lg.replace(`>Şifre</label>`, `>{t('login.password')}</label>`);

lg = lg.replace("authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'", "authMode === 'login' ? t('login.login_btn') : t('login.register_btn')");
lg = lg.replace("authMode === 'login' ? \"Hesabın yok mu?\" : \"Zaten hesabın var mı?\"", "authMode === 'login' ? t('login.no_account') : t('login.has_account')");
lg = lg.replace("authMode === 'login' ? \"Kayıt Ol\" : \"Giriş Yap\"", "authMode === 'login' ? t('login.register_btn') : t('login.login_btn')");

lg = lg.replace(">VEYA</span>", ">{t('login.or')}</span>");
lg = lg.replace(">Google ile Devam Et</span>", ">{t('login.google_login')}</span>");
lg = lg.replace(">Güvenli & Şifreli Bağlantı</span>", ">{t('login.secure')}</span>");

fs.writeFileSync('pages/Login.tsx', lg);

// --- ONBOARDING ---
let ob = fs.readFileSync('pages/Onboarding.tsx', 'utf8');

if (!ob.includes('useTranslation')) {
    ob = ob.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}

// Pass t down
ob = ob.replace("const WelcomeStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {", "const WelcomeStep: React.FC<{ onNext: () => void; t: any }> = ({ onNext, t }) => {");
ob = ob.replace(">YENİ NESIL ARAÇ YÖNETİMİ</span>", ">{t('onboarding.w_tag')}</span>");
ob = ob.replace(">Pro'ya Hoş Geldin</span>", ">{t('onboarding.w_welcome')}</span>");
ob = ob.replace(">Aracını takip et, bakımlarını yönet, maliyetlerini analiz et. Her şey tek yerde.</p>", ">{t('onboarding.w_desc')}</p>");
ob = ob.replace("<span>Başlayalım</span>", "<span>{t('onboarding.w_btn')}</span>");
ob = ob.replace(">Kurulum 2 dakikadan az sürer</p>", ">{t('onboarding.w_time')}</p>");

ob = ob.replace("const FeaturesStep: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {", "const FeaturesStep: React.FC<{ onNext: () => void; onBack: () => void; t: any }> = ({ onNext, onBack, t }) => {");
ob = ob.replace(">ÖZELLİKLER</p>", ">{t('onboarding.f_tag')}</p>");
ob = ob.replace(">Aracın için her şey</h2>", ">{t('onboarding.f_title')}</h2>");

ob = ob.replace(
    `const FEATURES = [
  {
    icon: Wrench,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    title: 'Akıllı Bakım Takibi',
    desc: 'Yağ, lastik, fren — tüm bakımları takip et, zamanı gelmeden uyarı al.',
  },
  {
    icon: BarChart2,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.12)',
    title: 'Finansal Analiz',
    desc: 'Aylık harcamalarını gör, bütçe hedefleri belirle, trend grafiklerini incele.',
  },
  {
    icon: Sparkles,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    title: 'Yapay Zeka Asistan',
    desc: 'Arızaları fotoğraftan tespit et, bakım önerileri al, sorularını sor.',
  },
  {
    icon: QrCode,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    title: 'QR Araç Kartı',
    desc: 'Serviste okutun, tüm geçmiş görünsün. Satışta şeffaflık sağla.',
  },
  {
    icon: Users,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    title: 'Aile Garajı',
    desc: 'Aile veya ekibinle araç verilerini paylaş, herkes kendi rolünde.',
  },
  {
    icon: Fuel,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    title: 'Yakıt Takibi',
    desc: 'Menzil tahmini, tüketim trendi, en ucuz istasyon bulma.',
  },
];`, `// FEATURES array generation is moved inside component or uses t()`
);

ob = ob.replace(`const FeaturesStep: React.FC<{ onNext: () => void; onBack: () => void; t: any }> = ({ onNext, onBack, t }) => {
  const [revealed, setRevealed] = useState(0);`, `const FeaturesStep: React.FC<{ onNext: () => void; onBack: () => void; t: any }> = ({ onNext, onBack, t }) => {
  const [revealed, setRevealed] = useState(0);
  
  const FEATURES = [
    { icon: Wrench, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', title: t('onboarding.f_1_title'), desc: t('onboarding.f_1_desc') },
    { icon: BarChart2, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', title: t('onboarding.f_2_title'), desc: t('onboarding.f_2_desc') },
    { icon: Sparkles, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', title: t('onboarding.f_3_title'), desc: t('onboarding.f_3_desc') },
    { icon: QrCode, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', title: t('onboarding.f_4_title'), desc: t('onboarding.f_4_desc') },
    { icon: Users, color: '#10b981', bg: 'rgba(16,185,129,0.12)', title: t('onboarding.f_5_title'), desc: t('onboarding.f_5_desc') },
    { icon: Fuel, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', title: t('onboarding.f_6_title'), desc: t('onboarding.f_6_desc') },
  ];`);

ob = ob.replace("İlk Aracımı Ekle <ChevronRight size={18} />", "{t('onboarding.f_btn')} <ChevronRight size={18} />");

ob = ob.replace("const AddVehicleStep: React.FC<{\n  onNext: (vehicle: QuickVehicle | null) => void;\n  onBack: () => void;\n}> = ({ onNext, onBack }) => {", "const AddVehicleStep: React.FC<{\n  onNext: (vehicle: QuickVehicle | null) => void;\n  onBack: () => void;\n  t: any;\n}> = ({ onNext, onBack, t }) => {");

ob = ob.replace("setError('Marka, model ve plaka zorunludur.');", "setError(t('onboarding.av_err_req'));");
ob = ob.replace("setError('Araç kaydedilemedi. Daha sonra tekrar deneyin.');", "setError(t('onboarding.av_err'));");

ob = ob.replace(">1/2 — MARKA</p>", ">{t('onboarding.av_1_tag')}</p>");
ob = ob.replace(">Aracının markası nedir?</h2>", ">{t('onboarding.av_1_title')}</h2>");
ob = ob.replace(">Hızlıca bir seç veya yazarak ara</p>", ">{t('onboarding.av_1_desc')}</p>");
ob = ob.replace("placeholder=\"Marka ara veya yaz...\"", "placeholder={t('onboarding.av_1_search')}");
ob = ob.replace("Devam Et\n          </button>", "{t('onboarding.av_1_btn')}\n          </button>");

ob = ob.replace(">2/2 — DETAYLAR</p>", ">{t('onboarding.av_2_tag')}</p>");
ob = ob.replace(">\n          {vehicle.brand} hakkında birkaç detay\n        </h2>", ">\n          {t('onboarding.av_2_title', { b: vehicle.brand })}\n        </h2>");

ob = ob.replace(`{[
          { key: 'model', label: 'Model', placeholder: 'Corolla, Golf, Clio...', type: 'text' },
          { key: 'year', label: 'Yıl', placeholder: new Date().getFullYear().toString(), type: 'number' },
          { key: 'plate', label: 'Plaka', placeholder: '34 ABC 123', type: 'text' },
          { key: 'mileage', label: 'Kilometre', placeholder: '0', type: 'number' },
        ]}`, `{[
          { key: 'model', label: t('onboarding.av_l_model').replace(' *', ''), placeholder: 'Corolla, Golf, Clio...', type: 'text' },
          { key: 'year', label: t('onboarding.av_l_year').replace(' *', ''), placeholder: new Date().getFullYear().toString(), type: 'number' },
          { key: 'plate', label: t('onboarding.av_l_plate').replace(' *', ''), placeholder: '34 ABC 123', type: 'text' },
          { key: 'mileage', label: t('onboarding.av_l_mileage'), placeholder: '0', type: 'number' },
        ]}`);

ob = ob.replace(">{saving ? 'Kaydediliyor...' : 'Aracımı Kaydet 🚗'}</button>", ">{saving ? t('onboarding.av_btn_saving') : t('onboarding.av_btn_save')}</button>");

ob = ob.replace("const NotificationsStep: React.FC<{\n  vehicleName: string;\n  onNext: () => void;\n  onBack: () => void;\n}> = ({ vehicleName, onNext, onBack }) => {", "const NotificationsStep: React.FC<{\n  vehicleName: string;\n  onNext: () => void;\n  onBack: () => void;\n  t: any;\n}> = ({ vehicleName, onNext, onBack, t }) => {");

ob = ob.replace("body: `${vehicleName || 'Aracın'} için hatırlatmalar aktif! 🚗`", "body: t('onboarding.n_body', { v: vehicleName || 'Aracın' })");

ob = ob.replace(">BİLDİRİMLER</p>", ">{t('onboarding.n_tag')}</p>");
ob = ob.replace(">Hiçbir bakımı kaçırma\n        </h2>", ">{t('onboarding.n_title')}\n        </h2>");
ob = ob.replace(">Önemli tarihleri ve bakım zamanlarını sana hatırlatalım.</p>", ">{t('onboarding.n_desc')}</p>");

ob = ob.replace(`{[
          { icon: Wrench, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', title: 'Yağ Değişimi Zamanı', body: 'Son değişimden 9.800 km geçti — yakında servis gerekiyor.' },
          { icon: Shield, color: '#10b981', bg: 'rgba(16,185,129,0.12)', title: 'Sigorta Yenileme', body: 'Trafik sigortanızın bitimine 14 gün kaldı.' },
          { icon: Bell, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', title: 'Servis Randevusu', body: 'Yarın saat 10:00 — Oto Servis Kurumsal randevunuz var.' },
        ]}`, `{[
          { icon: Wrench, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', title: t('onboarding.n_1_title'), body: t('onboarding.n_1_desc') },
          { icon: Shield, color: '#10b981', bg: 'rgba(16,185,129,0.12)', title: t('onboarding.n_2_title'), body: t('onboarding.n_2_desc') },
          { icon: Bell, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', title: t('onboarding.n_3_title'), body: t('onboarding.n_3_desc') },
        ]}`);

ob = ob.replace("{permState === 'requesting' ? 'İzin bekleniyor...' : 'Bildirimlere İzin Ver'}", "{permState === 'requesting' ? t('onboarding.n_btn_req') : t('onboarding.n_btn_allow')}");
ob = ob.replace(">Bildirimler aktif!</span>", ">{t('onboarding.n_active')}</span>");
ob = ob.replace(">Bildirimler reddedildi. Ayarlardan değiştirebilirsin.</p>", ">{t('onboarding.n_denied')}</p>");
ob = ob.replace("{permState === 'granted' ? 'Harika, devam et →' : 'Şimdilik geç →'}", "{permState === 'granted' ? t('onboarding.n_next') + ' →' : t('onboarding.n_skip') + ' →'}");

ob = ob.replace("const CompleteStep: React.FC<{ vehicleName: string; onFinish: () => void }> = ({ vehicleName, onFinish }) => {", "const CompleteStep: React.FC<{ vehicleName: string; onFinish: () => void; t: any }> = ({ vehicleName, onFinish, t }) => {");

ob = ob.replace(`const nextSteps = [
    { icon: Wrench, color: '#f59e0b', text: 'İlk bakım kaydını ekle' },
    { icon: BarChart2, color: '#6366f1', text: 'Analitik sayfasını keşfet' },
    { icon: Sparkles, color: '#8b5cf6', text: 'AI asistanına sor' },
  ];`, `const nextSteps = [
    { icon: Wrench, color: '#f59e0b', text: t('onboarding.c_1') },
    { icon: BarChart2, color: '#6366f1', text: t('onboarding.c_2') },
    { icon: Sparkles, color: '#8b5cf6', text: t('onboarding.c_3') },
  ];`);

ob = ob.replace("Hazırsın! 🎉", "{t('onboarding.c_title')}");
ob = ob.replace("{vehicleName} eklendi", "{t('onboarding.c_added', { v: vehicleName })}");
ob = ob.replace(">CarSync Pro artık senin. İşte ilk yapabileceğin birkaç şey:</p>", ">{t('onboarding.c_desc')}</p>");
ob = ob.replace("Garaja Git <ArrowRight size={18} />", "{t('onboarding.c_btn')} <ArrowRight size={18} />");

ob = ob.replace("export const Onboarding: React.FC = () => {\n  const navigate = useNavigate();", "export const Onboarding: React.FC = () => {\n  const navigate = useNavigate();\n  const { t } = useTranslation();");
ob = ob.replace("Atla\n          </button>", "{t('onboarding.skip')}\n          </button>");

// Pass down t to steps
ob = ob.replace("<WelcomeStep onNext={() => setStep('features')} />", "<WelcomeStep onNext={() => setStep('features')} t={t} />");
ob = ob.replace("<FeaturesStep onNext={() => setStep('add-vehicle')} onBack={() => setStep('welcome')} />", "<FeaturesStep onNext={() => setStep('add-vehicle')} onBack={() => setStep('welcome')} t={t} />");
ob = ob.replace("<AddVehicleStep\n          onNext={v => { setAddedVehicle(v); setStep('notifications'); }}\n          onBack={() => setStep('features')}\n        />", "<AddVehicleStep\n          onNext={v => { setAddedVehicle(v); setStep('notifications'); }}\n          onBack={() => setStep('features')}\n          t={t}\n        />");
ob = ob.replace("<NotificationsStep\n          vehicleName={vehicleName}\n          onNext={() => setStep('complete')}\n          onBack={() => setStep('add-vehicle')}\n        />", "<NotificationsStep\n          vehicleName={vehicleName}\n          onNext={() => setStep('complete')}\n          onBack={() => setStep('add-vehicle')}\n          t={t}\n        />");
ob = ob.replace("<CompleteStep vehicleName={vehicleName} onFinish={finish} />", "<CompleteStep vehicleName={vehicleName} onFinish={finish} t={t} />");

fs.writeFileSync('pages/Onboarding.tsx', ob);

console.log('Login, NotFound, and Onboarding translated!');
