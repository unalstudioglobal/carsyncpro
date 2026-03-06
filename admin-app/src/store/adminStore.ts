import { create } from 'zustand';
import type { UserProfile, Vehicle, AuditLog } from '../types';
import {
    fetchAllUsers,
    fetchAllVehicles,
    updateUserRole,
    deleteUser as deleteUserSvc,
    bulkDeleteUsers as bulkDeleteUsersSvc,
    deleteVehicle as deleteVehicleSvc,
    fetchGlobalAuditLogs
} from '../services/adminService';
import { collection, onSnapshot, query, collectionGroup, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface AdminState {
    users: UserProfile[];
    vehicles: Vehicle[];
    auditLogs: AuditLog[];
    loading: boolean;
    error: string | null;
    loadUsers: () => Promise<void>;
    loadAuditLogs: () => Promise<void>;
    subscribeToUsers: () => () => void;
    subscribeToVehicles: () => () => void;
    subscribeToAuditLogs: () => () => void;
    changeUserRole: (uid: string, role: string) => Promise<void>;
    deleteUser: (uid: string) => Promise<void>;
    bulkDeleteUsers: (uids: string[]) => Promise<void>;
    deleteVehicle: (userId: string, vehicleId: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
    users: [],
    vehicles: [],
    auditLogs: [],
    loading: false,
    error: null,

    loadUsers: async () => {
        set({ loading: true });
        try {
            const users = await fetchAllUsers();
            set({ users, loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    loadAuditLogs: async () => {
        set({ loading: true });
        try {
            const logs = await fetchGlobalAuditLogs();
            set({ auditLogs: logs, loading: false });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    subscribeToUsers: () => {
        set({ loading: true });
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
            set({ users, loading: false });
        }, (error) => {
            set({ error: error.message, loading: false });
        });
        return unsubscribe;
    },

    subscribeToVehicles: () => {
        set({ loading: true });
        const q = query(collectionGroup(db, 'vehicles'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const vehicles = snapshot.docs.map(doc => {
                const data = doc.data();
                const userId = doc.ref.parent.parent?.id;
                return { id: doc.id, userId, ...data } as Vehicle;
            });
            set({ vehicles, loading: false });
        }, (error) => {
            set({ error: error.message, loading: false });
        });
        return unsubscribe;
    },

    subscribeToAuditLogs: () => {
        set({ loading: true });
        const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const auditLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
            set({ auditLogs, loading: false });
        }, (error) => {
            set({ error: error.message, loading: false });
        });
        return unsubscribe;
    },

    changeUserRole: async (uid: string, role: string) => {
        try {
            await updateUserRole(uid, role);
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    deleteUser: async (uid: string) => {
        try {
            await deleteUserSvc(uid);
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    bulkDeleteUsers: async (uids: string[]) => {
        try {
            await bulkDeleteUsersSvc(uids);
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    deleteVehicle: async (userId: string, vehicleId: string) => {
        try {
            await deleteVehicleSvc(userId, vehicleId);
        } catch (err: any) {
            set({ error: err.message });
        }
    },
}));
