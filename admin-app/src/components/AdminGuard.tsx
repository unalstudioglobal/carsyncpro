import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { checkAdminAccess } from '../services/adminService';

export const AdminGuard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                const allowed = await checkAdminAccess(user.uid);
                setIsAdmin(allowed);
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                    <p className="text-gold font-bold tracking-widest uppercase animate-pulse">Yetki Kontrol Ediliyor...</p>
                </div>
            </div>
        );
    }

    return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};
