/**
 * firestoreService.ts
 * -------------------------------------------------
 * Tüm Firestore CRUD operasyonları burada toplanmıştır.
 * Her fonksiyon Firestore'u dener, başarısız olursa
 * localStorage fallback'ine geçer (offline destek).
 *
 * Firestore koleksiyon yapısı:
 *   users/{uid}/vehicles/{vehicleId}
 *   users/{uid}/logs/{logId}
 * -------------------------------------------------
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { Vehicle, ServiceLog, Appointment, Document, TireSet } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Giriş yapan kullanıcının UID'sini döndürür. Demo modda "demo" kullanır. */
const getUid = (): string =>
  auth.currentUser?.uid ?? (localStorage.getItem("isDemoMode") === "true" ? "demo" : "anonymous");

const vehiclesCol = () => collection(db, "users", getUid(), "vehicles");
const logsCol = () => collection(db, "users", getUid(), "logs");
const appointmentsCol = () => collection(db, "users", getUid(), "appointments");

// ─── localStorage keys ────────────────────────────────────────────────────────
const LS_VEHICLES = "ls_vehicles";
const LS_LOGS = "ls_logs";
const LS_APPOINTMENTS = "ls_appointments";

const lsGet = <T>(key: string): T[] => {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
};
const lsSet = (key: string, data: any[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.warn(`LocalStorage quota exceeded for ${key}. Trying to save without large images...`);

      // Resim verilerini (base64) temizle ve tekrar dene
      const cleanData = data.map(item => {
        const newItem = { ...item };

        // Ana resim base64 ise kaldır
        if (typeof newItem.image === 'string' && newItem.image.startsWith('data:')) {
          newItem.image = null;
        }

        // Galeri resimleri base64 ise kaldır
        if (Array.isArray(newItem.images)) {
          newItem.images = newItem.images.filter((img: string) => !img.startsWith('data:'));
        }

        // Log resmi base64 ise kaldır
        if (typeof newItem.imageUrl === 'string' && newItem.imageUrl.startsWith('data:')) {
          newItem.imageUrl = null;
        }

        return newItem;
      });

      try {
        localStorage.setItem(key, JSON.stringify(cleanData));
        console.log(`Saved cleaned data to ${key}`);
      } catch (retryError) {
        console.error(`Failed to save even cleaned data to ${key}`, retryError);
      }
    } else {
      console.error(`Error saving to localStorage (${key}):`, error);
    }
  }
};

// ─── Firestore durumu ─────────────────────────────────────────────────────────
let _firestoreAvailable: boolean | null = null;
let _firestoreCheckedAt = 0;
const FIRESTORE_CHECK_TTL = 5 * 60 * 1000; // 5 dakika — başarısız olursa tekrar dene

const isFirestoreAvailable = async (): Promise<boolean> => {
  // Cache hit: başarılıysa veya TTL henüz dolmadıysa önbellekten döndür
  if (_firestoreAvailable !== null) {
    const age = Date.now() - _firestoreCheckedAt;
    // Başarılıysa her zaman döndür, başarısızsa TTL sonrası tekrar dene
    if (_firestoreAvailable || age < FIRESTORE_CHECK_TTL) {
      return _firestoreAvailable;
    }
  }
  try {
    // Küçük bir test: kullanıcı dokümanına erişmeyi dene
    await getDoc(doc(db, "users", getUid()));
    _firestoreAvailable = true;
  } catch {
    _firestoreAvailable = false;
  }
  _firestoreCheckedAt = Date.now();
  return _firestoreAvailable;
};

// ─── User Management ──────────────────────────────────────────────────────────

/**
 * Kullanıcı profilini getirir.
 */
export const getUserProfile = async (): Promise<any> => {
  if (await isFirestoreAvailable()) {
    try {
      const userRef = doc(db, "users", getUid());
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data();
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }
  return null;
};

/**
 * Kullanıcı profilini günceller.
 */
export const updateUserProfile = async (data: any): Promise<void> => {
  if (await isFirestoreAvailable()) {
    try {
      const userRef = doc(db, "users", getUid());
      await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }
};

/**
 * Kullanıcı kayıt olduğunda veya giriş yaptığında kullanıcı dokümanını oluşturur/günceller.
 * Koleksiyon adı: kullanıcılar
 */
export const createUserDocument = async (user: any) => {
  if (!user) return;
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Kullanıcı veritabanında yoksa oluştur (Kayıtlı ama DB'de yok durumu dahil)
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    } else {
      // Kullanıcı varsa sadece son giriş zamanını güncelle
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error creating/updating user document:", error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  VEHICLES
// ─────────────────────────────────────────────────────────────────────────────

/** Kullanıcının tüm araçlarını getirir. */
export const fetchVehicles = async (): Promise<Vehicle[]> => {
  if (await isFirestoreAvailable()) {
    try {
      const snap = await getDocs(query(vehiclesCol(), orderBy("createdAt", "desc")));
      const vehicles = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vehicle));
      // Aynı zamanda localStorage'ı güncelle (cache)
      lsSet(LS_VEHICLES, vehicles);
      return vehicles;
    } catch (err) {
      console.warn("Firestore fetchVehicles hatası, localStorage'a geçiliyor:", err);
    }
  }
  // Fallback
  const vehicles = lsGet<Vehicle>(LS_VEHICLES);
  // Deduplicate vehicles from LS
  return Array.from(new Map(vehicles.map(v => [v.id, v])).values());
};

/** Yeni araç ekler. Firestore ID'sini döndürür. */
export const addVehicle = async (vehicle: Omit<Vehicle, "id">): Promise<string> => {
  if (await isFirestoreAvailable()) {
    try {
      const vehicleData = {
        ...vehicle,
        createdAt: serverTimestamp(),
      };

      const ref = await addDoc(vehiclesCol(), vehicleData);
      _syncVehicleToLS(ref.id, vehicleData as unknown as Vehicle);
      return ref.id;
    } catch (err) {
      console.warn("Firestore addVehicle hatası:", err);
    }
  }
  // Fallback: localStorage
  const id = `ls_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const vehicles = lsGet<Vehicle>(LS_VEHICLES);
  vehicles.unshift({ ...vehicle, id } as Vehicle);
  lsSet(LS_VEHICLES, vehicles);
  return id;
};

/** Mevcut aracı günceller. */
export const updateVehicle = async (id: string, data: Partial<Vehicle>): Promise<void> => {
  if (await isFirestoreAvailable()) {
    try {
      await updateDoc(doc(vehiclesCol(), id), { ...data, updatedAt: serverTimestamp() });
      _syncVehicleToLS(id, data as Vehicle);
      return;
    } catch (err) {
      console.warn("Firestore updateVehicle hatası:", err);
    }
  }
  // Fallback
  const vehicles = lsGet<Vehicle>(LS_VEHICLES).map((v) =>
    v.id === id ? { ...v, ...data } : v
  );
  lsSet(LS_VEHICLES, vehicles);
};

/** Aracı siler (arşivler değil — kalıcı silme). */
export const deleteVehicle = async (id: string): Promise<void> => {
  if (await isFirestoreAvailable()) {
    try {
      await deleteDoc(doc(vehiclesCol(), id));
    } catch (err) {
      console.warn("Firestore deleteVehicle hatası:", err);
    }
  }
  const vehicles = lsGet<Vehicle>(LS_VEHICLES).filter((v) => v.id !== id);
  lsSet(LS_VEHICLES, vehicles);
};

/** Aracı arşivler (status'u "Satıldı" yapmaz, sadece gizler). */
export const archiveVehicle = async (id: string): Promise<void> => {
  await updateVehicle(id, { status: "Satıldı" } as Partial<Vehicle>);
  // Eski yöntemle de uyumluluk
  const archivedIds: string[] = JSON.parse(localStorage.getItem("archived_vehicles") || "[]");
  if (!archivedIds.includes(id)) {
    localStorage.setItem("archived_vehicles", JSON.stringify([...archivedIds, id]));
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  SERVICE LOGS
// ─────────────────────────────────────────────────────────────────────────────

/** Belirli bir araca ait logları getirir. Boş vehicleId → tüm loglar. */
export const fetchLogs = async (vehicleId?: string): Promise<ServiceLog[]> => {
  if (await isFirestoreAvailable()) {
    try {
      const snap = await getDocs(query(logsCol(), orderBy("createdAt", "desc")));
      let logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceLog));
      if (vehicleId) logs = logs.filter((l) => l.vehicleId === vehicleId);
      lsSet(LS_LOGS, snap.docs.map((d) => ({ id: d.id, ...d.data() }))); // cache
      return logs;
    } catch (err) {
      console.warn("Firestore fetchLogs hatası:", err);
    }
  }
  let logs = lsGet<ServiceLog>(LS_LOGS);
  // Deduplicate logs from LS
  logs = Array.from(new Map(logs.map(l => [l.id, l])).values());

  if (vehicleId) logs = logs.filter((l) => l.vehicleId === vehicleId);
  return logs;
};

/** Yeni servis kaydı ekler. */
export const addLog = async (log: Omit<ServiceLog, "id">): Promise<string> => {
  if (await isFirestoreAvailable()) {
    try {
      const logData = {
        ...log,
        createdAt: serverTimestamp(),
      };

      const ref = await addDoc(logsCol(), logData);
      _syncLogToLS(ref.id, logData as unknown as ServiceLog);

      // Araç kilometresini güncelle
      if (log.mileage) {
        await updateVehicle(log.vehicleId, {
          mileage: log.mileage,
          lastLogDate: log.date,
        });
      }

      return ref.id;
    } catch (err) {
      console.warn("Firestore addLog hatası:", err);
    }
  }
  // Fallback
  const id = `ls_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const logs = lsGet<ServiceLog>(LS_LOGS);
  logs.unshift({ ...log, id } as ServiceLog);
  lsSet(LS_LOGS, logs);

  // Araç km güncelle (localStorage)
  if (log.mileage) {
    const vehicles = lsGet<Vehicle>(LS_VEHICLES).map((v) =>
      v.id === log.vehicleId
        ? { ...v, mileage: log.mileage, lastLogDate: log.date }
        : v
    );
    lsSet(LS_VEHICLES, vehicles);
  }

  return id;
};

/** Log kaydını günceller. */
export const updateLog = async (id: string, data: Partial<ServiceLog>): Promise<void> => {
  if (await isFirestoreAvailable()) {
    try {
      await updateDoc(doc(logsCol(), id), { ...data, updatedAt: serverTimestamp() });
      // Sync LS
      const logs = lsGet<ServiceLog>(LS_LOGS);
      const idx = logs.findIndex((l) => l.id === id);
      if (idx >= 0) {
        logs[idx] = { ...logs[idx], ...data };
        lsSet(LS_LOGS, logs);
      }
      return;
    } catch (err) {
      console.warn("Firestore updateLog hatası:", err);
    }
  }
  // Fallback
  const logs = lsGet<ServiceLog>(LS_LOGS).map((l) =>
    l.id === id ? { ...l, ...data } : l
  );
  lsSet(LS_LOGS, logs);
};

/** Servis kaydını siler. */
export const deleteLog = async (id: string): Promise<void> => {
  if (await isFirestoreAvailable()) {
    try {
      await deleteDoc(doc(logsCol(), id));
    } catch (err) {
      console.warn("Firestore deleteLog hatası:", err);
    }
  }
  const logs = lsGet<ServiceLog>(LS_LOGS).filter((l) => l.id !== id);
  lsSet(LS_LOGS, logs);
};

// ─────────────────────────────────────────────────────────────────────────────
//  APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Randevuları getirir. */
export const fetchAppointments = async (vehicleId?: string): Promise<Appointment[]> => {
  if (await isFirestoreAvailable()) {
    try {
      const snap = await getDocs(query(appointmentsCol(), orderBy("date", "asc")));
      let appointments = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
      if (vehicleId) appointments = appointments.filter((a) => a.vehicleId === vehicleId);
      lsSet(LS_APPOINTMENTS, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      return appointments;
    } catch (err) {
      console.warn("Firestore fetchAppointments hatası:", err);
    }
  }
  let appointments = lsGet<Appointment>(LS_APPOINTMENTS);
  if (vehicleId) appointments = appointments.filter((a) => a.vehicleId === vehicleId);
  return appointments;
};

/** Yeni randevu ekler. */
export const addAppointment = async (appointment: Omit<Appointment, "id">): Promise<string> => {
  if (await isFirestoreAvailable()) {
    try {
      const ref = await addDoc(appointmentsCol(), {
        ...appointment,
        createdAt: serverTimestamp(),
      });
      _syncAppointmentToLS(ref.id, appointment as Appointment);
      return ref.id;
    } catch (err) {
      console.warn("Firestore addAppointment hatası:", err);
    }
  }
  const id = `ls_appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const appointments = lsGet<Appointment>(LS_APPOINTMENTS);
  appointments.push({ ...appointment, id } as Appointment);
  lsSet(LS_APPOINTMENTS, appointments);
  return id;
};

/** Randevuyu günceller. */
export const updateAppointment = async (id: string, data: Partial<Appointment>): Promise<void> => {
  if (await isFirestoreAvailable()) {
    try {
      await updateDoc(doc(appointmentsCol(), id), { ...data, updatedAt: serverTimestamp() });
      _syncAppointmentToLS(id, data as Appointment);
      return;
    } catch (err) {
      console.warn("Firestore updateAppointment hatası:", err);
    }
  }
  const appointments = lsGet<Appointment>(LS_APPOINTMENTS).map((a) =>
    a.id === id ? { ...a, ...data } : a
  );
  lsSet(LS_APPOINTMENTS, appointments);
};

/** Randevuyu siler. */
export const deleteAppointment = async (id: string): Promise<void> => {
  if (await isFirestoreAvailable()) {
    try {
      await deleteDoc(doc(appointmentsCol(), id));
    } catch (err) {
      console.warn("Firestore deleteAppointment hatası:", err);
    }
  }
  const appointments = lsGet<Appointment>(LS_APPOINTMENTS).filter((a) => a.id !== id);
  lsSet(LS_APPOINTMENTS, appointments);
};

// ─── Private Helpers ──────────────────────────────────────────────────────────

const _syncVehicleToLS = (id: string, data: Partial<Vehicle>) => {
  const vehicles = lsGet<Vehicle>(LS_VEHICLES);
  const idx = vehicles.findIndex((v) => v.id === id);
  if (idx >= 0) vehicles[idx] = { ...vehicles[idx], ...data };
  else vehicles.unshift({ id, ...data } as Vehicle);
  lsSet(LS_VEHICLES, vehicles);
};

const _syncLogToLS = (id: string, data: Partial<ServiceLog>) => {
  const logs = lsGet<ServiceLog>(LS_LOGS);
  logs.unshift({ id, ...data } as ServiceLog);
  lsSet(LS_LOGS, logs);
};

const _syncAppointmentToLS = (id: string, data: Partial<Appointment>) => {
  const appointments = lsGet<Appointment>(LS_APPOINTMENTS);
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx >= 0) appointments[idx] = { ...appointments[idx], ...data };
  else appointments.push({ id, ...data } as Appointment);
  lsSet(LS_APPOINTMENTS, appointments);
};

// ─── Documents ────────────────────────────────────────────────────────────────

const documentsCol = () => collection(db, "users", getUid(), "documents");
const LS_DOCUMENTS = "ls_documents";

export const fetchDocuments = async (vehicleId?: string): Promise<Document[]> => {
  if (await isFirestoreAvailable()) {
    try {
      const snap = await getDocs(query(documentsCol(), orderBy("createdAt", "desc")));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Document[];
      lsSet(LS_DOCUMENTS, docs);
      return vehicleId ? docs.filter((d) => d.vehicleId === vehicleId) : docs;
    } catch (err) {
      console.warn("Firestore fetchDocuments hatası:", err);
    }
  }
  const docs = lsGet<Document>(LS_DOCUMENTS);
  return vehicleId ? docs.filter((d) => d.vehicleId === vehicleId) : docs;
};

export const addDocument = async (document: Omit<Document, "id">): Promise<string> => {
  if (await isFirestoreAvailable()) {
    try {
      const ref = await addDoc(documentsCol(), { ...document, createdAt: serverTimestamp() });
      const docs = lsGet<Document>(LS_DOCUMENTS);
      docs.unshift({ id: ref.id, ...document });
      lsSet(LS_DOCUMENTS, docs);
      return ref.id;
    } catch (err) {
      console.warn("Firestore addDocument hatası:", err);
    }
  }
  const id = `ls_doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const docs = lsGet<Document>(LS_DOCUMENTS);
  docs.unshift({ id, ...document });
  lsSet(LS_DOCUMENTS, docs);
  return id;
};

export const updateDocument = async (id: string, data: Partial<Document>): Promise<void> => {
  if (await isFirestoreAvailable()) {
    try {
      await updateDoc(doc(documentsCol(), id), { ...data, updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn("Firestore updateDocument hatası:", err);
    }
  }
  const docs = lsGet<Document>(LS_DOCUMENTS).map((d) => d.id === id ? { ...d, ...data } : d);
  lsSet(LS_DOCUMENTS, docs);
};

export const deleteDocument = async (id: string): Promise<void> => {
  if (await isFirestoreAvailable()) {
    try {
      await deleteDoc(doc(documentsCol(), id));
    } catch (err) {
      console.warn("Firestore deleteDocument hatası:", err);
    }
  }
  lsSet(LS_DOCUMENTS, lsGet<Document>(LS_DOCUMENTS).filter((d) => d.id !== id));
};

// ─── Tires ────────────────────────────────────────────────────────────────────

const tiresCol = () => collection(db, "users", getUid(), "tires");
const LS_TIRES = "ls_tires";

export const fetchTires = async (vehicleId?: string): Promise<TireSet[]> => {
  if (await isFirestoreAvailable()) {
    try {
      const snap = await getDocs(query(tiresCol(), orderBy("createdAt", "desc")));
      const tires = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as TireSet[];
      lsSet(LS_TIRES, tires);
      return vehicleId ? tires.filter((t) => t.vehicleId === vehicleId) : tires;
    } catch (err) {
      console.warn("Firestore fetchTires hatası:", err);
    }
  }
  const tires = lsGet<TireSet>(LS_TIRES);
  return vehicleId ? tires.filter((t) => t.vehicleId === vehicleId) : tires;
};

export const addTireSet = async (tire: Omit<TireSet, "id">): Promise<string> => {
  if (await isFirestoreAvailable()) {
    try {
      const ref = await addDoc(tiresCol(), { ...tire, createdAt: serverTimestamp() });
      const tires = lsGet<TireSet>(LS_TIRES);
      tires.unshift({ id: ref.id, ...tire });
      lsSet(LS_TIRES, tires);
      return ref.id;
    } catch (err) {
      console.warn("Firestore addTireSet hatası:", err);
    }
  }
  const id = `ls_tire_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const tires = lsGet<TireSet>(LS_TIRES);
  tires.unshift({ id, ...tire });
  lsSet(LS_TIRES, tires);
  return id;
};

export const updateTireSet = async (id: string, data: Partial<TireSet>): Promise<void> => {
  if (await isFirestoreAvailable()) {
    try {
      await updateDoc(doc(tiresCol(), id), { ...data, updatedAt: serverTimestamp() });
    } catch (err) {
      console.warn("Firestore updateTireSet hatası:", err);
    }
  }
  lsSet(LS_TIRES, lsGet<TireSet>(LS_TIRES).map((t) => t.id === id ? { ...t, ...data } : t));
};

export const deleteTireSet = async (id: string): Promise<void> => {
  if (await isFirestoreAvailable()) {
    try {
      await deleteDoc(doc(tiresCol(), id));
    } catch (err) {
      console.warn("Firestore deleteTireSet hatası:", err);
    }
  }
  lsSet(LS_TIRES, lsGet<TireSet>(LS_TIRES).filter((t) => t.id !== id));
};

export const syncLocalToFirestore = async () => {
  if (!(await isFirestoreAvailable())) return;

  // Sync Vehicles
  const localVehicles = lsGet<Vehicle>(LS_VEHICLES);
  const vehiclesToSync = localVehicles.filter(v => v.id.startsWith("ls_"));

  const idMap = new Map<string, string>(); // Map local ID to Firestore ID

  for (const v of vehiclesToSync) {
    const { id, ...vehicleData } = v;
    const ref = await addDoc(vehiclesCol(), { ...vehicleData, createdAt: serverTimestamp() });
    idMap.set(id, ref.id);

    // Update ID in localStorage
    const index = localVehicles.findIndex(item => item.id === id);
    if (index !== -1) {
      localVehicles[index].id = ref.id;
    }
  }
  lsSet(LS_VEHICLES, localVehicles);

  // Sync Logs
  const localLogs = lsGet<ServiceLog>(LS_LOGS);
  const logsToSync = localLogs.filter(l => l.id.startsWith("ls_"));

  for (const l of logsToSync) {
    const { id, ...logData } = l;

    // Update vehicleId if it was a local ID
    const newVehicleId = idMap.get(logData.vehicleId) || logData.vehicleId;

    const ref = await addDoc(logsCol(), { ...logData, vehicleId: newVehicleId, createdAt: serverTimestamp() });

    // Update ID in localStorage
    const index = localLogs.findIndex(item => item.id === id);
    if (index !== -1) {
      localLogs[index].id = ref.id;
      localLogs[index].vehicleId = newVehicleId;
    }
  }
  lsSet(LS_LOGS, localLogs);

  // Sync Appointments
  const localAppointments = lsGet<Appointment>(LS_APPOINTMENTS);
  const appointmentsToSync = localAppointments.filter(a => a.id.startsWith("ls_"));
  for (const a of appointmentsToSync) {
    const { id, ...apptData } = a;
    const newVehicleId = idMap.get(apptData.vehicleId) || apptData.vehicleId;
    const ref = await addDoc(appointmentsCol(), { ...apptData, vehicleId: newVehicleId, createdAt: serverTimestamp() });
    const index = localAppointments.findIndex(item => item.id === id);
    if (index !== -1) {
      localAppointments[index].id = ref.id;
      localAppointments[index].vehicleId = newVehicleId;
    }
  }
  lsSet(LS_APPOINTMENTS, localAppointments);

  // Sync Documents
  const localDocuments = lsGet<Document>(LS_DOCUMENTS);
  const docsToSync = localDocuments.filter(d => d.id.startsWith("ls_"));
  for (const d of docsToSync) {
    const { id, ...docData } = d;
    const newVehicleId = idMap.get(docData.vehicleId) || docData.vehicleId;
    const ref = await addDoc(documentsCol(), { ...docData, vehicleId: newVehicleId, createdAt: serverTimestamp() });
    const index = localDocuments.findIndex(item => item.id === id);
    if (index !== -1) {
      localDocuments[index].id = ref.id;
      localDocuments[index].vehicleId = newVehicleId;
    }
  }
  lsSet(LS_DOCUMENTS, localDocuments);

  // Sync Tires
  const localTires = lsGet<TireSet>(LS_TIRES);
  const tiresToSync = localTires.filter(t => t.id.startsWith("ls_"));
  for (const t of tiresToSync) {
    const { id, ...tireData } = t;
    const newVehicleId = idMap.get(tireData.vehicleId) || tireData.vehicleId;
    const ref = await addDoc(tiresCol(), { ...tireData, vehicleId: newVehicleId, createdAt: serverTimestamp() });
    const index = localTires.findIndex(item => item.id === id);
    if (index !== -1) {
      localTires[index].id = ref.id;
      localTires[index].vehicleId = newVehicleId;
    }
  }
  lsSet(LS_TIRES, localTires);
};
