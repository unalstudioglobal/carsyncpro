/**
 * settingsService.ts
 * Tüm kullanıcı ayarlarını Firebase Firestore + localStorage cache ile yönetir.
 */
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

// ─── Constants ────────────────────────────────────────────────────────────────
const LS_SETTINGS = "carsync_user_settings";
const DEBOUNCE_MS = 1500;

/** Firestore settings dokümanının yolu: users/{uid}/settings/preferences */
const settingsDoc = () => {
    const uid = auth.currentUser?.uid ?? "anonymous";
    return doc(db, "users", uid, "settings", "preferences");
};

// ─── In-memory cache ──────────────────────────────────────────────────────────
let _cache: Record<string, any> = {};
let _loaded = false;
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** localStorage'dan cache'i yükle (senkron, anlık) */
const _loadFromLS = (): Record<string, any> => {
    try {
        return JSON.parse(localStorage.getItem(LS_SETTINGS) || "{}");
    } catch {
        return {};
    }
};

/** localStorage'a yaz */
const _saveToLS = () => {
    try {
        localStorage.setItem(LS_SETTINGS, JSON.stringify(_cache));
    } catch (err) {
        console.warn("Settings localStorage kayıt hatası:", err);
    }
};

/** Debounce ile Firestore'a yaz */
const _scheduleFirestoreSync = () => {
    if (_debounceTimer) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(async () => {
        try {
            if (!auth.currentUser) return;
            await setDoc(settingsDoc(), _cache, { merge: true });
        } catch (err) {
            console.warn("Settings Firestore sync hatası:", err);
        }
    }, DEBOUNCE_MS);
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Firestore'dan ayarları yükle ve localStorage'ı güncelle.
 * App başlangıcında veya giriş sonrası çağrılmalı.
 */
export const loadSettings = async (): Promise<void> => {
    // Önce localStorage'dan yükle (anlık)
    _cache = _loadFromLS();
    _loaded = true;

    // Sonra Firestore'dan güncelle
    try {
        if (!auth.currentUser) return;
        const snap = await getDoc(settingsDoc());
        if (snap.exists()) {
            const remote = snap.data();
            // Uzak verilerle birleştir (uzak öncelikli)
            _cache = { ..._cache, ...remote };
            _saveToLS();
        } else {
            // Firestore'da yok — localStorage'daki mevcut verileri yükle
            if (Object.keys(_cache).length > 0) {
                await setDoc(settingsDoc(), _cache, { merge: true });
            }
        }
    } catch (err) {
        console.warn("Settings Firestore yükleme hatası:", err);
    }
};

/**
 * Tek bir ayar değerini oku (senkron — localStorage/cache'den).
 */
export const getSetting = <T>(key: string, defaultValue: T): T => {
    if (!_loaded) {
        _cache = _loadFromLS();
        _loaded = true;
    }
    const val = _cache[key];
    return val !== undefined ? val as T : defaultValue;
};

/**
 * Tek bir ayar değerini kaydet (Firestore + localStorage).
 */
export const saveSetting = (key: string, value: any): void => {
    if (!_loaded) {
        _cache = _loadFromLS();
        _loaded = true;
    }
    _cache[key] = value;
    _saveToLS();
    _scheduleFirestoreSync();
};

/**
 * Birden fazla ayarı aynı anda kaydet.
 */
export const saveSettings = (settings: Record<string, any>): void => {
    if (!_loaded) {
        _cache = _loadFromLS();
        _loaded = true;
    }
    Object.assign(_cache, settings);
    _saveToLS();
    _scheduleFirestoreSync();
};

/**
 * Tek bir ayarı sil.
 */
export const removeSetting = (key: string): void => {
    delete _cache[key];
    _saveToLS();
    _scheduleFirestoreSync();
};

/**
 * Tüm ayarları temizle (logout).
 */
export const clearSettings = (): void => {
    _cache = {};
    _loaded = false;
    localStorage.removeItem(LS_SETTINGS);
};

/**
 * Eski localStorage anahtarlarını settingsService'e taşı.
 * İlk seferde çalışır, sonra taşınan anahtarları siler.
 */
export const migrateOldSettings = (): void => {
    const migrations: Record<string, string> = {
        'theme': 'theme',
        'app_font_size': 'fontSize',
        'app_background_theme': 'backgroundTheme',
        'settings_notifications': 'notifications',
        'carsync_theme_config': 'themeConfig',
        'onboarding_completed': 'onboardingCompleted',
        'dashboard_tour_seen': 'dashboardTourSeen',
        'vehicle_detail_tour_seen': 'vehicleDetailTourSeen',
        'carsync_recent_searches': 'recentSearches',
        'carsync_budget_goals': 'budgetGoals',
        'carsync_insurance_events': 'insuranceEvents',
        'carsync_fuel_prefs': 'fuelPrefs',
        'carsync_family_garage': 'familyGarage',
        'carsync_smart_notifs': 'smartNotifs',
        'carsync_notif_rules': 'notifRules',
        'carsync_appt_extra': 'apptExtra',
        'archived_vehicles': 'archivedVehicles',
        'is_premium': 'isPremium',
    };

    // Zaten taşındıysa atla
    if (getSetting('_migrated', false)) return;

    let migrated = false;
    for (const [oldKey, newKey] of Object.entries(migrations)) {
        const raw = localStorage.getItem(oldKey);
        if (raw !== null && _cache[newKey] === undefined) {
            try {
                _cache[newKey] = JSON.parse(raw);
            } catch {
                _cache[newKey] = raw; // String ise olduğu gibi kaydet
            }
            migrated = true;
        }
    }

    if (migrated) {
        _cache['_migrated'] = true;
        _saveToLS();
        _scheduleFirestoreSync();
    }
};
