import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../store/adminStore';
import {
    Car, Search,
    Calendar, Gauge,
    ShieldAlert, Trash2,
    AlertCircle
} from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import type { Vehicle } from '../types';

const VehicleCard: React.FC<{ vehicle: Vehicle; onDelete: (v: Vehicle) => void }> = ({ vehicle, onDelete }) => (
    <div className="glass p-6 rounded-[32px] border-white/5 hover:border-gold/20 transition-all group relative overflow-hidden">
        <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gold border border-white/5 group-hover:scale-110 transition-transform">
                <Car size={32} />
            </div>
            <div className="flex flex-col items-end gap-2">
                <div className="px-3 py-1 rounded-lg bg-gold-dim border border-gold/20">
                    <span className="text-[10px] font-black tracking-widest text-gold uppercase">{vehicle.plate || 'PLAKA YOK'}</span>
                </div>
                <button
                    onClick={() => onDelete(vehicle)}
                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>

        <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-1 truncate">{vehicle.brand} {vehicle.model}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{vehicle.year} Model</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Gauge size={14} />
                <span className="text-xs truncate">{vehicle.mileage?.toLocaleString()} km</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Calendar size={14} />
                <span className="text-xs">{vehicle.year}</span>
            </div>
        </div>

        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
);

export const Vehicles: React.FC = () => {
    const { vehicles, loading, subscribeToVehicles, deleteVehicle } = useAdminStore();
    const [search, setSearch] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<Vehicle | null>(null);

    useEffect(() => {
        const unsubscribe = subscribeToVehicles();
        return () => unsubscribe();
    }, [subscribeToVehicles]);

    const handleDelete = async () => {
        if (!confirmDelete || !confirmDelete.userId) return;
        try {
            await deleteVehicle(confirmDelete.userId, confirmDelete.id);
            setConfirmDelete(null);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.brand?.toLowerCase().includes(search.toLowerCase()) ||
        v.model?.toLowerCase().includes(search.toLowerCase()) ||
        v.plate?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4 lg:p-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-white">Sistemdeki Tüm Araçlar</h1>
                    <p className="text-[var(--text-secondary)]">Platform genelindeki her bir aracı buradan takip edebilirsiniz.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                        <input
                            type="text"
                            placeholder="Marka, model veya plaka..."
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-gold/30 transition-all font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <main>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading && vehicles.length === 0 ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="glass p-6 rounded-[32px] border-white/5 space-y-4">
                                <Skeleton variant="circle" className="h-12 w-12" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-20" />
                            </div>
                        ))
                    ) : filteredVehicles.length === 0 ? (
                        <div className="col-span-full py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10 text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
                                <ShieldAlert size={32} />
                            </div>
                            <p className="text-[var(--text-secondary)] italic">Daha araç eklenmemiş veya arama sonucu bulunamadı.</p>
                        </div>
                    ) : (
                        filteredVehicles.map((vehicle) => (
                            <VehicleCard key={vehicle.id} vehicle={vehicle} onDelete={setConfirmDelete} />
                        ))
                    )}
                </div>
            </main>

            {/* Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setConfirmDelete(null)} />
                    <div className="relative glass p-8 rounded-[40px] border-red-500/20 max-w-md w-full text-center animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={48} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Araç Siliniyor</h3>
                        <p className="text-[var(--text-secondary)] text-sm mb-8">
                            <span className="text-white font-bold">{confirmDelete.brand} {confirmDelete.model}</span> aracını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold hover:scale-105 active:scale-95 transition-all text-sm"
                            >
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
