/**
 * DataContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Uygulama genelinde araç, log ve randevu verisi için TEK kaynak.
 *
 * Neden gerekli?
 *   • Eski yapıda her sayfa bağımsız fetchVehicles()/fetchLogs() çağırıyordu
 *     → 15+ sayfada tekrarlı Firestore okuması ve stale data sorunu.
 *   • Bu context, onSnapshot ile gerçek zamanlı dinleyiciler kurar:
 *     - Firestore bağlantısı varsa → anlık güncelleme, sıfır manuel refetch
 *     - Offline ise → localStorage cache'i kullanır, bağlantı dönünce sync eder
 *
 * Kullanım:
 *   const { vehicles, logs, appointments, loading, refetch } = useData();
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  createContext, useContext, useEffect, useRef,
  useState, useCallback, useMemo,
} from 'react';
import {
  collection, query, orderBy, onSnapshot,
  Unsubscribe, Timestamp, doc, getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { Vehicle, ServiceLog, Appointment, GamificationData } from '../types';
import { gamificationService, XP_RULES } from '../services/GamificationService';
import { updateDoc } from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyncStatus {
  vehicles:     'idle' | 'loading' | 'live' | 'offline';
  logs:         'idle' | 'loading' | 'live' | 'offline';
  appointments: 'idle' | 'loading' | 'live' | 'offline';
}

interface DataContextValue {
  vehicles:     Vehicle[];
  logs:         ServiceLog[];
  appointments: Appointment[];
  loading:      boolean;       // true = ilk yükleme devam ediyor
  synced:       boolean;       // en az bir kez Firestore'dan veri geldi mi
  syncStatus:   SyncStatus;
  gamification: GamificationData;
  /** XP kazanma tetikleyicisi */
  gainXP: (action: keyof typeof XP_RULES) => Promise<void>;
  /** Anlık snapshot yerine manuel yenileme zorunluysa (örn. offline sonrası) */
  refetch:      () => Promise<void>;
  /** Optimistik UI: local state'e anında yansıtır, Firestore'a async yazar */
  optimisticAddVehicle:    (v: Vehicle)   => void;
  optimisticUpdateVehicle: (id: string, data: Partial<Vehicle>) => void;
  optimisticRemoveVehicle: (id: string) => void;
  optimisticAddLog:        (l: ServiceLog) => void;
  optimisticUpdateLog:     (id: string, data: Partial<ServiceLog>) => void;
  optimisticRemoveLog:     (id: string) => void;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS = {
  vehicles:     'ls_vehicles',
  logs:         'ls_logs',
  appointments: 'ls_appointments',
} as const;

function lsGet<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]; }
  catch { return []; }
}
const lsSet = (key: string, data: unknown[]) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
};

// ─── Firestore → plain object helpers ────────────────────────────────────────

const tsToISO = (v: unknown): string | undefined => {
  if (!v) return undefined;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'string') return v;
  return undefined;
};

const docToVehicle = (id: string, data: Record<string, any>): Vehicle => ({
  ...data,
  id,
  createdAt:  tsToISO(data.createdAt),
  updatedAt:  tsToISO(data.updatedAt),
} as unknown as Vehicle);

const docToLog = (id: string, data: Record<string, any>): ServiceLog => ({
  ...data,
  id,
  date:       data.date ?? tsToISO(data.createdAt),
  createdAt:  tsToISO(data.createdAt),
} as unknown as ServiceLog);

const docToAppt = (id: string, data: Record<string, any>): Appointment => ({
  ...data,
  id,
  date:      data.date ?? tsToISO(data.createdAt),
  createdAt: tsToISO(data.createdAt),
} as unknown as Appointment);

// ─── Context ──────────────────────────────────────────────────────────────────

const DataContext = createContext<DataContextValue>({
  vehicles: [], logs: [], appointments: [],
  loading: true, synced: false,
  syncStatus: { vehicles: 'idle', logs: 'idle', appointments: 'idle' },
  gamification: { xp: 0, level: 1, achievements: [], streakDays: 0 },
  gainXP: async () => {},
  refetch: async () => {},
  optimisticAddVehicle:    () => {},
  optimisticUpdateVehicle: () => {},
  optimisticRemoveVehicle: () => {},
  optimisticAddLog:        () => {},
  optimisticUpdateLog:     () => {},
  optimisticRemoveLog:     () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uid,          setUid]          = useState<string | null>(null);
  const [vehicles,     setVehicles]     = useState<Vehicle[]>(lsGet(LS.vehicles));
  const [logs,         setLogs]         = useState<ServiceLog[]>(lsGet(LS.logs));
  const [appointments, setAppointments] = useState<Appointment[]>(lsGet(LS.appointments));
  const [loading,      setLoading]      = useState(true);
  const [synced,       setSynced]       = useState(false);
  const [syncStatus,   setSyncStatus]   = useState<SyncStatus>({
    vehicles: 'idle', logs: 'idle', appointments: 'idle',
  });
  const [gamification, setGamification] = useState<GamificationData>({
    xp: 0, level: 1, achievements: [], streakDays: 0
  });

  const unsubsRef = useRef<Unsubscribe[]>([]);

  // Dinleyicileri temizle
  const clearListeners = useCallback(() => {
    unsubsRef.current.forEach(u => u());
    unsubsRef.current = [];
  }, []);

  // ── onSnapshot kurulum ───────────────────────────────────────────────────

  const setupListeners = useCallback((userId: string) => {
    clearListeners();
    setLoading(true);

    const colRef = (name: string) =>
      collection(db, 'users', userId, name);

    let resolvedCount = 0;
    const tryDone = () => {
      resolvedCount++;
      if (resolvedCount >= 3) { setLoading(false); setSynced(true); }
    };

    // ── Araçlar ──
    setSyncStatus(s => ({ ...s, vehicles: 'loading' }));
    const unsubV = onSnapshot(
      query(colRef('vehicles'), orderBy('createdAt', 'desc')),
      (snap) => {
        const data = snap.docs.map(d => docToVehicle(d.id, d.data() as Record<string, any>));
        setVehicles(data);
        lsSet(LS.vehicles, data);
        setSyncStatus(s => ({ ...s, vehicles: 'live' }));
        tryDone();
      },
      (err) => {
        console.warn('[DataContext] vehicles snapshot error:', err.code);
        setSyncStatus(s => ({ ...s, vehicles: 'offline' }));
        tryDone();
      }
    );

    // ── Loglar ──
    setSyncStatus(s => ({ ...s, logs: 'loading' }));
    const unsubL = onSnapshot(
      query(colRef('logs'), orderBy('createdAt', 'desc')),
      (snap) => {
        const data = snap.docs.map(d => docToLog(d.id, d.data() as Record<string, any>));
        setLogs(data);
        lsSet(LS.logs, data);
        setSyncStatus(s => ({ ...s, logs: 'live' }));
        tryDone();
      },
      (err) => {
        console.warn('[DataContext] logs snapshot error:', err.code);
        setSyncStatus(s => ({ ...s, logs: 'offline' }));
        tryDone();
      }
    );

    // ── Randevular ──
    setSyncStatus(s => ({ ...s, appointments: 'loading' }));
    const unsubA = onSnapshot(
      query(colRef('appointments'), orderBy('createdAt', 'desc')),
      (snap) => {
        const data = snap.docs.map(d => docToAppt(d.id, d.data() as Record<string, any>));
        setAppointments(data);
        lsSet(LS.appointments, data);
        setSyncStatus(s => ({ ...s, appointments: 'live' }));
        tryDone();
      },
      (err) => {
        console.warn('[DataContext] appointments snapshot error:', err.code);
        setSyncStatus(s => ({ ...s, appointments: 'offline' }));
        tryDone();
      }
    );

    // ── Oyunlaştırma ──
    const unsubG = onSnapshot(doc(db, 'users', userId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.gamification) {
          setGamification(data.gamification as GamificationData);
        }
      }
    });

    unsubsRef.current = [unsubV, unsubL, unsubA, unsubG];
  }, [clearListeners]);

  // ── Auth state ───────────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const newUid = user?.uid ?? (localStorage.getItem('isDemoMode') === 'true' ? 'demo' : null);
      setUid(newUid);

      if (newUid) {
        setupListeners(newUid);
      } else {
        clearListeners();
        setVehicles([]);
        setLogs([]);
        setAppointments([]);
        setLoading(false);
        setSynced(false);
        setSyncStatus({ vehicles: 'idle', logs: 'idle', appointments: 'idle' });
      }
    });
    return () => { unsub(); clearListeners(); };
  }, [setupListeners, clearListeners]);

  // ── Gain XP ─────────────────────────────────────────────────────────────
  const gainXP = useCallback(async (action: keyof typeof XP_RULES) => {
    if (!uid) return;

    const { newData, unlockedAchievements } = gamificationService.processAction(gamification, action);
    
    // UI'da anlık göster (optimistik)
    setGamification(newData);

    try {
      await updateDoc(doc(db, 'users', uid), {
        gamification: newData
      });
      
      if (unlockedAchievements.length > 0) {
        // Achievement unlock haptic (service içinde yapılıyor ama burada bildirim eklenebilir)
        console.log('Achievements unlocked:', unlockedAchievements);
      }
    } catch (err) {
      console.error('XP update error:', err);
    }
  }, [uid, gamification]);

  // ── Manuel refetch (offline recovery için) ───────────────────────────────

  const refetch = useCallback(async () => {
    if (uid) setupListeners(uid);
  }, [uid, setupListeners]);

  // ── Optimistik güncelleme helpers ────────────────────────────────────────
  // Firestore snapshot gelince zaten doğru hale gelecek;
  // bu fonksiyonlar sadece UI'da anlık yansıma için kullanılır.

  const optimisticAddVehicle = useCallback((v: Vehicle) => {
    setVehicles(prev => [v, ...prev]);
  }, []);

  const optimisticUpdateVehicle = useCallback((id: string, data: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
  }, []);

  const optimisticRemoveVehicle = useCallback((id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, []);

  const optimisticAddLog = useCallback((l: ServiceLog) => {
    setLogs(prev => [l, ...prev]);
  }, []);

  const optimisticUpdateLog = useCallback((id: string, data: Partial<ServiceLog>) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  }, []);

  const optimisticRemoveLog = useCallback((id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  }, []);

  // ── Memoize value ────────────────────────────────────────────────────────

  const value = useMemo<DataContextValue>(() => ({
    vehicles, logs, appointments,
    loading, synced, syncStatus,
    refetch,
    optimisticAddVehicle,
    optimisticUpdateVehicle,
    optimisticRemoveVehicle,
    optimisticAddLog,
    optimisticUpdateLog,
    optimisticRemoveLog,
    gamification,
    gainXP,
  }), [
    vehicles, logs, appointments,
    loading, synced, syncStatus, refetch,
    optimisticAddVehicle, optimisticUpdateVehicle, optimisticRemoveVehicle,
    optimisticAddLog, optimisticUpdateLog, optimisticRemoveLog,
    gamification, gainXP,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useData = () => useContext(DataContext);

/** Sadece araçlar için kolaylık hook'u */
export const useVehicles = () => {
  const { vehicles, loading, synced } = useData();
  return { vehicles, loading, synced };
};

/** Sadece loglar için kolaylık hook'u */
export const useLogs = (vehicleId?: string) => {
  const { logs, loading } = useData();
  const filtered = vehicleId ? logs.filter(l => l.vehicleId === vehicleId) : logs;
  return { logs: filtered, loading };
};

/** Belirli bir araç için kolaylık hook'u */
export const useVehicle = (vehicleId?: string) => {
  const { vehicles, loading } = useData();
  const vehicle = vehicleId ? vehicles.find(v => v.id === vehicleId) ?? null : null;
  return { vehicle, loading };
};
