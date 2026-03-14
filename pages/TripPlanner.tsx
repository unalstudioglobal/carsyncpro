import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Map, Navigation, Fuel, Calculator, Info } from 'lucide-react';
import { Vehicle } from '../types';
import { fetchVehicles } from '../services/firestoreService';

export const TripPlanner: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [logs, setLogs] = useState<any[]>([]);
  
  // Form State
  const [distance, setDistance] = useState<number>(0);
  const [fuelPrice, setFuelPrice] = useState<number>(42.50); // Default price
  const [consumption, setConsumption] = useState<number>(7.5); // Default consumption

  const [result, setResult] = useState<{ cost: number, fuel: number } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [v, l] = await Promise.all([
          fetch(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/fuel/national-prices` : '/api/fuel/national-prices').then(r => r.json()),
          fetchVehicles()
        ]);
        
        if (v.success) {
          setFuelPrice(v.prices.gasoline); // Default to gasoline
        }
        setVehicles(l);
        if (l.length > 0) setSelectedVehicleId(l[0].id);
        
        // Fetch logs for usage calculation
        const allLogs = await import('../services/firestoreService').then(m => m.fetchLogs());
        setLogs(allLogs);
      } catch (err) {
        console.error("Yükleme hatası:", err);
      }
    };
    load();
  }, []);

  // Tüketimi araç geçmişinden hesapla (Yakıt alımları ortalaması)
  useEffect(() => {
    if (selectedVehicleId && logs.length > 0) {
      const vLogs = logs.filter(l => l.vehicleId === selectedVehicleId && l.type === 'Yakıt Alımı' && l.liters && l.mileage);
      
      if (vLogs.length >= 2) {
        // En eski ve en yeni yakıt alımı arasındaki km ve yakılan yakıt
        const sorted = [...vLogs].sort((a, b) => a.mileage - b.mileage);
        const totalDistance = sorted[sorted.length - 1].mileage - sorted[0].mileage;
        const totalLiters = sorted.slice(1).reduce((sum, l) => sum + (l.liters || 0), 0);
        
        if (totalDistance > 0 && totalLiters > 0) {
            const avg = (totalLiters / totalDistance) * 100;
            setConsumption(avg);
            return;
        }
      }
      
      // Default / Fallback (Random if no real data yet, but better than static 7.5)
      setConsumption(7.8);
    }
  }, [selectedVehicleId, logs]);

  const calculate = () => {
      const fuelNeeded = (distance * consumption) / 100;
      const cost = fuelNeeded * fuelPrice;
      setResult({ cost, fuel: fuelNeeded });
  };

  return (
    <div className="p-5 space-y-6 animate-fadeIn pb-24">
      <header className="flex justify-between items-center pt-2">
        <div className="flex items-center space-x-3">
            <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
                <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('trip.title')}</h1>
        </div>
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

      <div className="grid md:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
              <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center">
                      <Navigation size={14} className="mr-1" /> Mesafe (km)
                  </label>
                  <input 
                      type="number" 
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-lg font-bold outline-none focus:border-blue-500 transition text-slate-900 dark:text-white"
                      placeholder="0"
                      value={distance || ''}
                      onChange={e => setDistance(parseFloat(e.target.value))}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center">
                          <Fuel size={14} className="mr-1" /> {t('trip.consumption')}
                      </label>
                      <input 
                          type="number" 
                          step="0.1"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-lg font-bold outline-none focus:border-blue-500 transition text-slate-900 dark:text-white"
                          value={consumption.toFixed(1)}
                          onChange={e => setConsumption(parseFloat(e.target.value))}
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center">
                          <span className="mr-1">₺</span> {t('trip.price')}
                      </label>
                      <input 
                          type="number" 
                          step="0.01"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-lg font-bold outline-none focus:border-blue-500 transition text-slate-900 dark:text-white"
                          value={fuelPrice}
                          onChange={e => setFuelPrice(parseFloat(e.target.value))}
                      />
                  </div>
              </div>

              <button 
                  onClick={calculate}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center space-x-2"
              >
                  <Calculator size={20} />
                  <span>{t('trip.calculate')}</span>
              </button>
          </div>

          {/* Result Card */}
          <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden flex flex-col justify-center min-h-[200px]">
              {/* Background Decoration */}
              <div className="absolute right-0 top-0 p-6 opacity-5">
                  <Map size={150} className="text-white" />
              </div>

              {result ? (
                  <div className="relative z-10 space-y-6 animate-fadeIn">
                      <div className="text-center">
                          <div className="text-sm text-slate-400 mb-1">{t('trip.est_cost')}</div>
                          <div className="text-4xl font-bold text-white">₺{result.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                          <div className="text-center">
                              <div className="text-xs text-slate-500 mb-1">{t('trip.req_fuel')}</div>
                              <div className="text-xl font-bold text-blue-400">{result.fuel.toFixed(1)} L</div>
                          </div>
                          <div className="text-center">
                              <div className="text-xs text-slate-500 mb-1">{t('trip.per_km')}</div>
                              <div className="text-xl font-bold text-amber-400">₺{(result.cost / distance).toFixed(2)}</div>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="text-center text-slate-500 relative z-10">
                      <Info size={48} className="mx-auto mb-3 opacity-50" />
                      <p>{t('trip.info')}</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
