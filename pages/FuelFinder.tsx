import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import {
  ChevronLeft, Fuel, MapPin, Navigation, RefreshCw, Star,
  Clock, ChevronRight, Filter, Loader2, AlertCircle, Info,
  TrendingDown, Zap, Droplet, CheckCircle2, Phone, ExternalLink,
  SortAsc, Target, Shield
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FuelStation {
  id: string;
  name: string;
  brand: string;
  address: string;
  distance: number; // km
  lat: number;
  lng: number;
  isOpen: boolean;
  rating: number | null;
  totalRatings: number;
  placeId: string;
  // Fuel prices — entered by user or fetched from community
  prices: {
    gasoline95?: number;
    gasoline97?: number;
    diesel?: number;
    lpg?: number;
  };
}

type FuelType = 'gasoline95' | 'gasoline97' | 'diesel' | 'lpg';
type SortMode = 'distance' | 'price' | 'rating';

// ─── Constants ───────────────────────────────────────────────────────────────

const FUEL_LABELS: Record<FuelType, { labelKey: string; color: string; icon: React.ElementType }> = {
  gasoline95: { labelKey: 'fuel_95', color: 'text-green-400', icon: Fuel },
  gasoline97: { labelKey: 'fuel_97', color: 'text-emerald-400', icon: Fuel },
  diesel: { labelKey: 'fuel_diesel', color: 'text-amber-400', icon: Droplet },
  lpg: { labelKey: 'fuel_lpg', color: 'text-blue-400', icon: Zap },
};

const BRAND_COLORS: Record<string, string> = {
  'Shell': 'from-yellow-500 to-red-500',
  'BP': 'from-green-500 to-yellow-500',
  'Total': 'from-red-500 to-blue-500',
  'Petrol Ofisi': 'from-blue-600 to-blue-400',
  'Opet': 'from-orange-500 to-yellow-400',
  'Lukoil': 'from-red-600 to-orange-500',
  'TP': 'from-blue-500 to-cyan-400',
};

const getBrandGradient = (brand: string) =>
  BRAND_COLORS[brand] || 'from-slate-600 to-slate-500';

// ─── Google Places Nearby Search via Fetch ───────────────────────────────────

const fetchNearbyStations = async (
  lat: number,
  lng: number,
  radius: number = 5000
): Promise<FuelStation[]> => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    // Return mock data if no key configured
    return getMockStations(lat, lng);
  }

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=gas_station&key=${key}`;

  try {
    const res = await fetch(`/api/places?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    return (data.results || []).map((place: any, i: number) => {
      const plat = place.geometry.location.lat;
      const plng = place.geometry.location.lng;
      const dist = haversineKm(lat, lng, plat, plng);

      return {
        id: place.place_id,
        name: place.name,
        brand: extractBrand(place.name),
        address: place.vicinity,
        distance: dist,
        lat: plat,
        lng: plng,
        isOpen: place.opening_hours?.open_now ?? true,
        rating: place.rating ?? null,
        totalRatings: place.user_ratings_total ?? 0,
        placeId: place.place_id,
        prices: {},
      };
    });
  } catch {
    return getMockStations(lat, lng);
  }
};

// Mock data for demo / no API key
const getMockStations = (lat: number, lng: number): FuelStation[] => [
  {
    id: '1', name: 'Shell İstasyonu', brand: 'Shell',
    address: 'Atatürk Cad. No:12', distance: 0.4, lat: lat + 0.003, lng: lng + 0.002,
    isOpen: true, rating: 4.3, totalRatings: 182, placeId: 'mock1',
    prices: { gasoline95: 42.80, gasoline97: 45.20, diesel: 40.10, lpg: 17.50 }
  },
  {
    id: '2', name: 'Petrol Ofisi', brand: 'Petrol Ofisi',
    address: 'Cumhuriyet Mah. Şehit Sk.', distance: 0.9, lat: lat - 0.005, lng: lng + 0.004,
    isOpen: true, rating: 4.1, totalRatings: 94, placeId: 'mock2',
    prices: { gasoline95: 42.60, diesel: 39.90, lpg: 17.20 }
  },
  {
    id: '3', name: 'Opet', brand: 'Opet',
    address: 'İnönü Bulvarı No:55', distance: 1.3, lat: lat + 0.008, lng: lng - 0.003,
    isOpen: false, rating: 3.9, totalRatings: 56, placeId: 'mock3',
    prices: { gasoline95: 43.10, gasoline97: 45.50, diesel: 40.30 }
  },
  {
    id: '4', name: 'BP Connect', brand: 'BP',
    address: 'Millet Cad. No:88', distance: 1.7, lat: lat - 0.009, lng: lng - 0.006,
    isOpen: true, rating: 4.5, totalRatings: 310, placeId: 'mock4',
    prices: { gasoline95: 42.40, gasoline97: 44.90, diesel: 39.75, lpg: 17.00 }
  },
  {
    id: '5', name: 'Lukoil', brand: 'Lukoil',
    address: 'Organize San. Çevreyolu', distance: 2.4, lat: lat + 0.012, lng: lng + 0.010,
    isOpen: true, rating: 4.0, totalRatings: 73, placeId: 'mock5',
    prices: { gasoline95: 42.20, diesel: 39.50, lpg: 16.90 }
  },
  {
    id: '6', name: 'Total Energies', brand: 'Total',
    address: 'D750 Karayolu 3. km', distance: 3.1, lat: lat - 0.014, lng: lng + 0.012,
    isOpen: true, rating: 4.2, totalRatings: 128, placeId: 'mock6',
    prices: { gasoline95: 43.30, gasoline97: 45.80, diesel: 40.60 }
  },
];

// ─── Utilities ───────────────────────────────────────────────────────────────

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
};

const extractBrand = (name: string): string => {
  const brands = ['Shell', 'BP', 'Total', 'Petrol Ofisi', 'Opet', 'Lukoil', 'TP'];
  return brands.find(b => name.toLowerCase().includes(b.toLowerCase())) || name.split(' ')[0];
};

const openMaps = (lat: number, lng: number, name: string) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`;
  window.open(url, '_blank');
};

// ─── Sub Components ──────────────────────────────────────────────────────────

const BrandAvatar: React.FC<{ brand: string; size?: number }> = ({ brand, size = 10 }) => (
  <div className={`w-${size} h-${size} rounded-xl bg-gradient-to-br ${getBrandGradient(brand)} flex items-center justify-center flex-shrink-0`}>
    <Fuel size={size * 1.6} className="text-white/90" />
  </div>
);

const StationCard: React.FC<{
  t: any;
  station: FuelStation;
  activeFuel: FuelType;
  cheapestPrice: number | null;
  onPriceReport: (id: string) => void;
}> = ({ station, activeFuel, cheapestPrice, onPriceReport, t }) => {
  const [expanded, setExpanded] = useState(false);
  const price = station.prices[activeFuel];
  const isCheapest = price !== undefined && cheapestPrice !== null && price === cheapestPrice;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${isCheapest
      ? 'bg-emerald-500/10 border-emerald-500/30'
      : station.isOpen
        ? 'bg-slate-800/40 border-slate-700/30'
        : 'bg-slate-800/20 border-slate-700/20 opacity-60'
      }`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left">
        <div className="flex items-center gap-3">
          <BrandAvatar brand={station.brand} size={10} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-white font-semibold text-sm truncate">{station.name}</p>
              {isCheapest && (
                <span className="flex-shrink-0 flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-medium">
                  <TrendingDown size={9} />
                  {t('fuel.cheapest')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={10} />
                <span>{station.distance} km</span>
              </div>
              <span className="text-slate-700">·</span>
              <div className={`flex items-center gap-1 text-xs ${station.isOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
                <Clock size={10} />
                <span>{station.isOpen ? t('fuel.open_now') : t('fuel.closed')}</span>
              </div>
              {station.rating && (
                <>
                  <span className="text-slate-700">·</span>
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <Star size={10} />
                    <span>{station.rating}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="flex flex-col items-end flex-shrink-0">
            {price !== undefined ? (
              <p className={`text-lg font-bold ${isCheapest ? 'text-emerald-400' : 'text-white'}`}>
                ₺{price.toFixed(2)}
              </p>
            ) : (
              <p className="text-xs text-slate-500">{t('fuel.no_price')}</p>
            )}
            <p className="text-[10px] text-slate-500">{t('fuel.per_liter')}</p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-700/30 pt-3 space-y-3">
          {/* All fuel prices */}
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(FUEL_LABELS) as [FuelType, typeof FUEL_LABELS[FuelType]][]).map(([key, meta]) => {
              const p = station.prices[key];
              const FuelIcon = meta.icon;
              return (
                <div key={key} className={`flex items-center justify-between bg-slate-700/30 rounded-xl px-3 py-2 ${key === activeFuel ? 'ring-1 ring-white/10' : ''}`}>
                  <div className="flex items-center gap-1.5">
                    <FuelIcon size={11} className={meta.color} />
                    <span className="text-slate-400 text-xs">{t(`fuel.${meta.labelKey}`)}</span>
                  </div>
                  <span className={`text-xs font-bold ${p ? 'text-white' : 'text-slate-600'}`}>
                    {p ? `₺${p.toFixed(2)}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Address */}
          <p className="text-slate-500 text-xs flex items-start gap-1.5">
            <MapPin size={11} className="flex-shrink-0 mt-0.5" />
            {station.address}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => openMaps(station.lat, station.lng, station.name)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-all"
            >
              <Navigation size={12} />
              {t('fuel.directions')}
            </button>
            <button
              onClick={() => onPriceReport(station.id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-xs hover:bg-slate-600 transition-all"
            >
              <Fuel size={12} />
              {t('fuel.report_price')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Price report modal
const PriceReportModal: React.FC<{
  t: any;
  stationId: string;
  stations: FuelStation[];
  onClose: () => void;
  onSave: (stationId: string, fuelType: FuelType, price: number) => void;
}> = ({ stationId, stations, onClose, onSave, t }) => {
  const station = stations.find(s => s.id === stationId);
  const [fuelType, setFuelType] = useState<FuelType>('gasoline95');
  const [price, setPrice] = useState('');

  if (!station) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0f172a] rounded-3xl border border-slate-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">{t('fuel.report_title')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <ChevronLeft size={16} className="text-slate-400" />
          </button>
        </div>
        <p className="text-slate-400 text-xs">{station.name} · {station.address}</p>

        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(FUEL_LABELS) as [FuelType, typeof FUEL_LABELS[FuelType]][]).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setFuelType(key)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${fuelType === key ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
            >
              <meta.icon size={12} />
              {t(`fuel.${meta.labelKey}`)}
            </button>
          ))}
        </div>

        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">{t('fuel.liter_price')}</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder={t('fuel.price_ph')}
            className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-sm border border-slate-700 focus:outline-none focus:border-green-500"
          />
        </div>

        <button
          disabled={!price || isNaN(Number(price))}
          onClick={() => { onSave(stationId, fuelType, Number(price)); onClose(); }}
          className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold text-sm disabled:opacity-40"
        >
          Kaydet
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const FuelFinder: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFuel, setActiveFuel] = useState<FuelType>('gasoline95');
  const [sortMode, setSortMode] = useState<SortMode>('distance');
  const [radiusKm, setRadiusKm] = useState(5);
  const [reportingStation, setReportingStation] = useState<string | null>(null);
  const [showOpenOnly, setShowOpenOnly] = useState(false);

  // ── Ulusal Yakıt Fiyatları ────────────────────────────
  const [nationalPrices, setNationalPrices] = useState<{
    gasoline95?: number; gasoline97?: number; diesel?: number; lpg?: number;
    updatedAt?: string; source?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/fuel/national-prices')
      .then(r => r.json())
      .then(setNationalPrices)
      .catch(() => {});
  }, []);

  const getLocation = useCallback(() => {
    setLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        fetchNearbyStations(latitude, longitude, radiusKm * 1000).then(s => {
          setStations(s);
          setLoading(false);
        });
      },
      err => {
        setLocationError('Konum alınamadı. Lütfen tarayıcı izinlerini kontrol edin.');
        // Load demo data anyway
        fetchNearbyStations(39.9334, 32.8597, radiusKm * 1000).then(s => {
          setStations(s);
          setLoading(false);
        });
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [radiusKm]);

  useEffect(() => { getLocation(); }, []);

  const handlePriceSave = (stationId: string, fuelType: FuelType, price: number) => {
    setStations(prev => prev.map(s =>
      s.id === stationId ? { ...s, prices: { ...s.prices, [fuelType]: price } } : s
    ));
  };

  // Sort & filter
  const sortedStations = [...stations]
    .filter(s => !showOpenOnly || s.isOpen)
    .sort((a, b) => {
      if (sortMode === 'distance') return a.distance - b.distance;
      if (sortMode === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortMode === 'price') {
        const pa = a.prices[activeFuel] ?? Infinity;
        const pb = b.prices[activeFuel] ?? Infinity;
        return pa - pb;
      }
      return 0;
    });

  // Find cheapest price for badge
  const cheapestPrice = sortedStations.reduce<number | null>((min, s) => {
    const p = s.prices[activeFuel];
    if (p === undefined) return min;
    return min === null ? p : Math.min(min, p);
  }, null);

  const avgPrice = (() => {
    const prices = stations.map(s => s.prices[activeFuel]).filter(Boolean) as number[];
    if (!prices.length) return null;
    return (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
  })();

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0f1e] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a0f1e]/90 backdrop-blur-xl border-b border-slate-800/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
            <ChevronLeft size={20} className="text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{t('fuel.title')}</h1>
            <p className="text-slate-500 text-xs">
              {location ? t('fuel.subtitle_loc') : t('fuel.subtitle_near')}
            </p>
          </div>
          <button
            onClick={getLocation}
            className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center"
          >
            <RefreshCw size={16} className={`text-slate-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Fuel type tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {(Object.entries(FUEL_LABELS) as [FuelType, typeof FUEL_LABELS[FuelType]][]).map(([key, meta]) => {
            const FuelIcon = meta.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveFuel(key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${activeFuel === key
                  ? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                  }`}
              >
                <FuelIcon size={12} className={activeFuel === key ? 'text-white' : meta.color} />
                {t('fuel.' + meta.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Location error */}
        {locationError && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs">{locationError} {t('fuel.demo_data')}</p>
          </div>
        )}

        {/* Ulusal Güncel Yakıt Fiyatları Bandı */}
        {nationalPrices && (
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingDown size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Türkiye Ulusal Ortalama</span>
              </div>
              {nationalPrices.updatedAt && (
                <span className="text-[9px] text-slate-600">
                  {new Date(nationalPrices.updatedAt).toLocaleDateString('tr-TR')}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {([
                { key: 'gasoline95', label: '95' , color: 'text-green-400'  },
                { key: 'gasoline97', label: '97' , color: 'text-emerald-400'},
                { key: 'diesel',     label: 'Dizel', color: 'text-amber-400'},
                { key: 'lpg',        label: 'LPG', color: 'text-blue-400'  },
              ] as const).map(({ key, label, color }) => {
                const price = nationalPrices[key];
                const isActive = activeFuel === key;
                return (
                  <div
                    key={key}
                    className={`rounded-lg p-2 text-center transition ${isActive ? 'bg-white/10 ring-1 ring-white/20' : 'bg-slate-900/40'}`}
                  >
                    <p className={`text-xs font-black ${price ? color : 'text-slate-600'}`}>
                      {price ? `₺${price.toFixed(2)}` : '—'}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats bar */}
        {!loading && stations.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{stations.length}</p>
              <p className="text-slate-500 text-[10px]">{t('fuel.stations_count')}</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-emerald-400 font-bold text-lg">
                {cheapestPrice ? `₺${cheapestPrice.toFixed(2)}` : '—'}
              </p>
              <p className="text-slate-500 text-[10px]">{t('fuel.cheapest')}</p>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{avgPrice ? `₺${avgPrice}` : '—'}</p>
              <p className="text-slate-500 text-[10px]">{t('fuel.avg_price')}</p>
            </div>
          </div>
        )}

        {/* Sort & filter row */}
        {!loading && stations.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {([
              { key: 'distance', label: t('fuel.sort_dist') },
              { key: 'price', label: t('fuel.sort_price') },
              { key: 'rating', label: t('fuel.sort_rating') },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortMode(key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${sortMode === key
                  ? 'bg-slate-200 text-slate-900'
                  : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                  }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setShowOpenOnly(!showOpenOnly)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${showOpenOnly
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                }`}
            >
              <CheckCircle2 size={10} />
              {t('fuel.filter_open')}
            </button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 size={14} className="text-green-400 animate-spin" />
              <p className="text-slate-400 text-sm">{t('fuel.searching')}</p>
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-slate-800/40 animate-pulse border border-slate-700/30" />
            ))}
          </div>
        )}

        {/* Station list */}
        {!loading && (
          <div className="space-y-3">
            {sortedStations.map(station => (
              <StationCard
                key={station.id}
                station={station}
                activeFuel={activeFuel}
                cheapestPrice={cheapestPrice}
                onPriceReport={setReportingStation}
                t={t}
              />
            ))}
          </div>
        )}

        {/* Setup note */}
        {!loading && (
          <div className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Info size={13} className="text-blue-400" />
              <p className="text-slate-300 text-xs font-semibold">{t('fuel.real_prices_title')}</p>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              <Trans i18nKey="fuel.real_prices_desc">
                Gerçek fiyat verisi için <span className="text-slate-300 font-medium">VITE_GOOGLE_MAPS_API_KEY</span> ortam değişkenini
                ayarlayın ya da istasyonlarda <span className="text-green-400">Fiyat Bildir</span> butonuyla topluluk fiyatları oluşturun.
              </Trans>
            </p>
          </div>
        )}
      </div>

      {/* Price report modal */}
      {reportingStation && (
        <PriceReportModal
          stationId={reportingStation}
          stations={stations}
          onClose={() => setReportingStation(null)}
          onSave={handlePriceSave}
          t={t}
        />
      )}
    </div>
  );
};
