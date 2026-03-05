import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Disc, MapPin, Plus, Ruler, Thermometer, Warehouse, ArrowRightLeft, Trash2 } from 'lucide-react';
import { TireSet, Vehicle } from '../types';
import { fetchVehicles, fetchTires, addTireSet, updateTireSet, deleteTireSet } from '../services/firestoreService';

export const Tires: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [tireSets, setTireSets] = useState<TireSet[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [newTire, setNewTire] = useState<Partial<TireSet>>({
    type: 'Summer',
    brand: '',
    size: '',
    location: 'Hotel',
    treadDepthFrontLeft: 7,
    treadDepthFrontRight: 7,
    treadDepthRearLeft: 7,
    treadDepthRearRight: 7,
    storageLocation: ''
  });

  useEffect(() => {
    const loadVehicles = async () => {
      const v = await fetchVehicles();
      setVehicles(v);
      if (v.length > 0) setSelectedVehicleId(v[0].id);
    };
    loadVehicles();
  }, []);

  // Gerçek Firestore'dan lastikleri yükle
  useEffect(() => {
    if (!selectedVehicleId) return;
    const load = async () => {
      const tires = await fetchTires(selectedVehicleId);
      setTireSets(tires);
    };
    load();
  }, [selectedVehicleId]);

  const handleAddTire = async () => {
    if (!newTire.brand || !newTire.size) return;
    setLoading(true);
    try {
      const tireData: Omit<TireSet, 'id'> = {
        vehicleId: selectedVehicleId,
        type: newTire.type as any,
        brand: newTire.brand!,
        size: newTire.size!,
        location: newTire.location as any,
        treadDepthFrontLeft: newTire.treadDepthFrontLeft || 0,
        treadDepthFrontRight: newTire.treadDepthFrontRight || 0,
        treadDepthRearLeft: newTire.treadDepthRearLeft || 0,
        treadDepthRearRight: newTire.treadDepthRearRight || 0,
        storageLocation: newTire.storageLocation,
      };
      const id = await addTireSet(tireData);
      setTireSets(prev => [{ id, ...tireData }, ...prev]);
      setShowAddModal(false);
      setNewTire({ type: 'Summer', brand: '', size: '', location: 'Hotel', treadDepthFrontLeft: 7, treadDepthFrontRight: 7, treadDepthRearLeft: 7, treadDepthRearRight: 7, storageLocation: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTire = async (id: string) => {
    await deleteTireSet(id);
    setTireSets(prev => prev.filter(t => t.id !== id));
  };

  const swapTires = async () => {
    const updated = tireSets.map(t => ({
      ...t,
      location: (t.location === 'OnVehicle' ? 'Hotel' : t.location === 'Hotel' ? 'OnVehicle' : t.location) as TireSet['location'],
    }));
    setTireSets(updated);
    // Firestore'a güncelle
    await Promise.all(updated.map(t => updateTireSet(t.id, { location: t.location })));
  };

  return (
    <div className="p-5 space-y-6 animate-fadeIn pb-24">
      <header className="flex justify-between items-center pt-2">
        <div className="flex items-center space-x-3">
            <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
                <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Lastik Oteli</h1>
        </div>
        <button 
            onClick={() => setShowAddModal(true)}
            className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition shadow-lg shadow-blue-500/30 text-white"
        >
            <Plus size={24} />
        </button>
      </header>

      {/* Vehicle Selector */}
      <div className="flex space-x-3 overflow-x-auto pb-2 hide-scrollbar">
        {vehicles.map(v => (
            <button
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    selectedVehicleId === v.id 
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
            >
                {v.plate}
            </button>
        ))}
      </div>

      {/* Tire Sets List */}
      <div className="grid gap-6">
        {tireSets.map(tire => (
            <div key={tire.id} className={`rounded-2xl p-6 shadow-sm border relative overflow-hidden group ${
                tire.location === 'OnVehicle' 
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-900/20' 
                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white'
            }`}>
                {tire.location === 'OnVehicle' && (
                    <div className="absolute right-0 top-0 p-6 opacity-10">
                        <Disc size={120} />
                    </div>
                )}
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                tire.location === 'OnVehicle' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                            }`}>
                                {tire.type === 'Summer' ? 'Yazlık' : tire.type === 'Winter' ? 'Kışlık' : '4 Mevsim'}
                            </span>
                            {tire.location === 'OnVehicle' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-400 text-green-900 uppercase tracking-wider flex items-center">
                                    <ArrowRightLeft size={10} className="mr-1" /> Takılı
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-bold">{tire.brand}</h3>
                        <p className={`text-sm ${tire.location === 'OnVehicle' ? 'text-blue-100' : 'text-slate-500'}`}>{tire.size}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`p-3 rounded-xl ${tire.location === 'OnVehicle' ? 'bg-white/10' : 'bg-slate-50 dark:bg-slate-700'}`}>
                            <Disc size={24} className={tire.location === 'OnVehicle' ? 'text-white' : 'text-slate-400'} />
                        </div>
                        <button
                            onClick={() => handleDeleteTire(tire.id)}
                            className={`p-2 rounded-xl transition ${tire.location === 'OnVehicle' ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500'}`}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {tire.location !== 'OnVehicle' && (
                    <div className="flex items-center space-x-2 text-sm text-slate-500 mb-4 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
                        <Warehouse size={16} />
                        <span>Konum: <span className="font-semibold text-slate-700 dark:text-slate-300">{tire.storageLocation || 'Belirtilmedi'}</span></span>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <div className={`p-3 rounded-xl ${tire.location === 'OnVehicle' ? 'bg-blue-700/50' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                        <div className={`text-[10px] uppercase font-bold mb-1 ${tire.location === 'OnVehicle' ? 'text-blue-200' : 'text-slate-400'}`}>Ön Diş Derinliği</div>
                        <div className="flex justify-between items-end">
                            <span className="text-lg font-bold">{tire.treadDepthFrontLeft} mm</span>
                            <Ruler size={14} className="opacity-50 mb-1" />
                        </div>
                    </div>
                    <div className={`p-3 rounded-xl ${tire.location === 'OnVehicle' ? 'bg-blue-700/50' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                        <div className={`text-[10px] uppercase font-bold mb-1 ${tire.location === 'OnVehicle' ? 'text-blue-200' : 'text-slate-400'}`}>Arka Diş Derinliği</div>
                        <div className="flex justify-between items-end">
                            <span className="text-lg font-bold">{tire.treadDepthRearLeft} mm</span>
                            <Ruler size={14} className="opacity-50 mb-1" />
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>
      
      {/* Swap Action */}
      <div className="bg-slate-800 rounded-2xl p-6 text-center">
          <h3 className="text-white font-bold mb-2">Mevsim Değişimi</h3>
          <p className="text-slate-400 text-sm mb-4">Lastiklerin yerini değiştirmek için tıklayın.</p>
          <button 
            onClick={swapTires}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl w-full transition shadow-lg shadow-blue-900/20"
          >
              Lastikleri Değiştir (Yaz ↔ Kış)
          </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 space-y-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Yeni Lastik Seti</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tip</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Summer', 'Winter', 'AllSeason'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setNewTire({ ...newTire, type: type as any })}
                                    className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                                        newTire.type === type 
                                        ? 'bg-blue-600 text-white border-blue-600' 
                                        : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                    }`}
                                >
                                    {type === 'Summer' ? 'Yazlık' : type === 'Winter' ? 'Kışlık' : '4 Mevsim'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Marka</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition text-slate-900 dark:text-white"
                            placeholder="Örn: Michelin"
                            value={newTire.brand}
                            onChange={e => setNewTire({ ...newTire, brand: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ebat</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition text-slate-900 dark:text-white"
                            placeholder="Örn: 225/45 R17"
                            value={newTire.size}
                            onChange={e => setNewTire({ ...newTire, size: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Konum</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setNewTire({ ...newTire, location: 'OnVehicle' })}
                                className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                                    newTire.location === 'OnVehicle'
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                }`}
                            >
                                Araç Üzerinde
                            </button>
                            <button
                                onClick={() => setNewTire({ ...newTire, location: 'Hotel' })}
                                className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                                    newTire.location === 'Hotel'
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                }`}
                            >
                                Otel / Depo
                            </button>
                        </div>
                    </div>

                    {newTire.location === 'Hotel' && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Depo / Otel Adı</label>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition text-slate-900 dark:text-white"
                                placeholder="Örn: Euromaster Maslak"
                                value={newTire.storageLocation}
                                onChange={e => setNewTire({ ...newTire, storageLocation: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ön Diş (mm)</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition text-slate-900 dark:text-white"
                                value={newTire.treadDepthFrontLeft}
                                onChange={e => setNewTire({ ...newTire, treadDepthFrontLeft: parseFloat(e.target.value), treadDepthFrontRight: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Arka Diş (mm)</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition text-slate-900 dark:text-white"
                                value={newTire.treadDepthRearLeft}
                                onChange={e => setNewTire({ ...newTire, treadDepthRearLeft: parseFloat(e.target.value), treadDepthRearRight: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex space-x-3 pt-2">
                    <button 
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        İptal
                    </button>
                    <button 
                        onClick={handleAddTire}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition disabled:opacity-50"
                    >
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
