import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    collectionGroup,
    query,
    orderBy,
    limit,
    addDoc,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import type { UserProfile, Vehicle, AuditLog, Appointment, Document, TireSet } from '../types';

export const fetchAllUsers = async (): Promise<UserProfile[]> => {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
};

export const fetchAllVehicles = async (): Promise<Vehicle[]> => {
    const vehiclesCol = collectionGroup(db, 'vehicles');
    const snapshot = await getDocs(vehiclesCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
};

export const fetchUserVehicles = async (uid: string): Promise<Vehicle[]> => {
    const vehiclesCol = collection(db, 'users', uid, 'vehicles');
    const snapshot = await getDocs(vehiclesCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
};

export const fetchUserLogs = async (uid: string): Promise<any[]> => {
    const logsCol = collection(db, 'users', uid, 'logs');
    const snapshot = await getDocs(logsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateUserRole = async (uid: string, role: string): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });

    // Log action
    const currentAdmin = auth.currentUser;
    await logAdminAction({
        adminId: currentAdmin?.uid || 'system',
        adminName: currentAdmin?.email || 'System',
        action: 'ROLE_CHANGE',
        targetId: uid,
        details: `User role changed to ${role}`
    });
};

export const checkAdminAccess = async (uid: string): Promise<boolean> => {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return false;
    return userDoc.data()?.role === 'admin';
};

export const getSystemConfig = async () => {
    const configRef = doc(db, 'system', 'config');
    const snap = await getDoc(configRef);
    return snap.exists() ? snap.data() : null;
};

export const updateSystemConfig = async (data: any) => {
    const configRef = doc(db, 'system', 'config');
    await setDoc(configRef, data, { merge: true });

    // Log action
    const currentAdmin = auth.currentUser;
    await logAdminAction({
        adminId: currentAdmin?.uid || 'system',
        adminName: currentAdmin?.email || 'System',
        action: 'CONFIG_UPDATE',
        details: 'System configuration updated'
    });
};

export const deleteUser = async (uid: string): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);

    // Log action
    const currentAdmin = auth.currentUser;
    await logAdminAction({
        adminId: currentAdmin?.uid || 'system',
        adminName: currentAdmin?.email || 'System',
        action: 'DELETE_USER',
        targetId: uid,
        details: `User deleted: ${uid}`
    });
};

export const bulkDeleteUsers = async (uids: string[]): Promise<void> => {
    const batch = writeBatch(db);
    uids.forEach(uid => {
        batch.delete(doc(db, 'users', uid));
    });
    await batch.commit();

    const currentAdmin = auth.currentUser;
    await logAdminAction({
        adminId: currentAdmin?.uid || 'system',
        adminName: currentAdmin?.email || 'System',
        action: 'BULK_DELETE_USERS',
        details: `Deleted ${uids.length} users: ${uids.join(', ')}`
    });
};

export const deleteVehicle = async (userId: string, vehicleId: string): Promise<void> => {
    const vehicleRef = doc(db, 'users', userId, 'vehicles', vehicleId);
    await deleteDoc(vehicleRef);

    // Log action
    const currentAdmin = auth.currentUser;
    await logAdminAction({
        adminId: currentAdmin?.uid || 'system',
        adminName: currentAdmin?.email || 'System',
        action: 'DELETE_VEHICLE',
        targetId: vehicleId,
        details: `Vehicle ${vehicleId} deleted from user ${userId}`
    });
};

export const fetchUserFullActivity = async (uid: string): Promise<any[]> => {
    const logsCol = collection(db, 'users', uid, 'logs');
    const q = query(logsCol, orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Phase 6: Global Audit & Analytics
export const logAdminAction = async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const logsCol = collection(db, 'audit_logs');
    await addDoc(logsCol, {
        ...log,
        timestamp: serverTimestamp()
    });
};

export const fetchGlobalAuditLogs = async (): Promise<AuditLog[]> => {
    const logsCol = collection(db, 'audit_logs');
    const q = query(logsCol, orderBy('timestamp', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
};

// Phase 8: Feature Usage Analytics
export const fetchAllAppointments = async (): Promise<Appointment[]> => {
    const col = collectionGroup(db, 'appointments');
    const snapshot = await getDocs(col);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
};

export const fetchAllDocuments = async (): Promise<Document[]> => {
    const col = collectionGroup(db, 'documents');
    const snapshot = await getDocs(col);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
};

export const fetchAllTireSets = async (): Promise<TireSet[]> => {
    const col = collectionGroup(db, 'tires');
    const snapshot = await getDocs(col);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TireSet));
};
