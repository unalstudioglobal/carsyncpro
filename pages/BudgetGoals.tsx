import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Target, Plus, Edit3, Check, X, Wallet,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Fuel, Wrench, Shield, MoreHorizontal, Droplet, Zap,
  Calendar, ChevronDown, Info, Trash2, Sparkles, Lock
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from 'recharts';
import { fetchVehicles, fetchLogs, fetchBudgetGoals, addBudgetGoal, updateBudgetGoal, deleteBudgetGoal } from '../services/firestoreService';
import { Vehicle, ServiceLog, BudgetGoal, BudgetCategory } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

// BudgetGoal and BudgetCategory moved to types.ts

interface MonthlySpend {
  month: string; // YYYY-MM
  fuel: number;
  maintenance: number;
  insurance: number;
  other: number;
  total: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_META: Record<BudgetCategory, {
  label: string; icon: React.ElementType; color: string;
  bg: string; border: string; gradient: string;
}> = {
  total: { label: 'Toplam Harcama', icon: Wallet, color: 'text-white', bg: 'bg-slate-700/60', border: 'border-slate-600/40', gradient: '#6366f1' },
  fuel: { label: 'Yakıt', icon: Fuel, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', gradient: '#3b82f6' },
  maintenance: { label: 'Bakım', icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', gradient: '#f59e0b' },
  insurance: { label: 'Sigorta', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', gradient: '#8b5cf6' },
  other: { label: 'Diğer', icon: MoreHorizontal, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', gradient: '#64748b' },
};

const LOG_CATEGORY_MAP: Record<string, BudgetCategory> = {
  'Yakıt Alımı': 'fuel',
  'Yağ Değişimi': 'maintenance',
  'Periyodik Bakım': 'maintenance',
  'Lastik Değişimi': 'maintenance',
  'Lastik Rotasyonu': 'maintenance',
  'Fren Servisi': 'maintenance',
  'Akü Değişimi': 'maintenance',
  'Muayene': 'insurance',
  'Yıkama & Detay': 'other',
};

const LS_KEY = 'carsync_budget_goals';
const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// Helpers removed - using firestoreService

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  return `${MONTHS_TR[Number(m) - 1]} ${y}`;
};

const buildMonthlySpends = (logs: ServiceLog[], vehicleId: string): MonthlySpend[] => {
  const filtered = vehicleId === 'all' ? logs : logs.filter(l => l.vehicleId === vehicleId);
  const map: Record<string, MonthlySpend> = {};

  filtered.forEach(log => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(log.date)) return;
    const ym = log.date.slice(0, 7);
    if (!map[ym]) map[ym] = { month: ym, fuel: 0, maintenance: 0, insurance: 0, other: 0, total: 0 };
    const cat = LOG_CATEGORY_MAP[log.type] || 'other';
    map[ym][cat] += log.cost;
    map[ym].total += log.cost;
  });

  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
};

// ─── Sub Components ──────────────────────────────────────────────────────────

const RadialProgress: React.FC<{ pct: number; size?: number; color: string }> = ({ pct, size = 64, color }) => {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const capped = Math.min(pct, 100);
  const offset = circ - (capped / 100) * circ;
  const strokeColor = pct >= 100 ? '#ef4444' : pct >= 85 ? '#f59e0b' : color;

  return (
    <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={strokeColor} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.3s' }}
      />
    </svg>
  );
};

const BudgetCard: React.FC<{
  goal: BudgetGoal;
  vehicleName: string;
  currentSpend: number;
  history: MonthlySpend[];
  onEdit: () => void;
  onDelete: () => void;
}> = ({ goal, vehicleName, currentSpend, history, onEdit, onDelete }) => {
  const meta = CATEGORY_META[goal.category];
  const Icon = meta.icon;
  const pct = goal.monthlyLimit > 0 ? Math.round((currentSpend / goal.monthlyLimit) * 100) : 0;
  const remaining = goal.monthlyLimit - currentSpend;
  const over = remaining < 0;
  const { t } = useTranslation(); // In BudgetCard

  // Build sparkline data from history
  const sparkData = history.map(h => ({
    name: MONTHS_TR[Number(h.month.split('-')[1]) - 1],
    value: h[goal.category],
  }));

  return (
    <div className={`rounded-2xl border ${meta.bg} ${meta.border} overflow-hidden`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${meta.bg} border ${meta.border} flex items-center justify-center`}>
              <Icon size={16} className={meta.color} />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{goal.category === 'total' ? t('budget.total_expense') : t(`budget.${goal.category}`)}</p>
              <p className="text-slate-500 text-xs">{vehicleName}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={onEdit} className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center hover:bg-slate-600/60 transition-all">
              <Edit3 size={12} className="text-slate-400" />
            </button>
            <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center hover:bg-red-500/20 transition-all">
              <Trash2 size={12} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Progress + amounts */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-shrink-0">
            <RadialProgress pct={pct} size={72} color={meta.gradient} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${pct >= 100 ? 'text-red-400' : pct >= 85 ? 'text-amber-400' : 'text-white'}`}>
                {pct}%
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-slate-500 text-xs">{t('budget.spent')}</p>
              <p className="text-white font-bold text-lg leading-none">₺{currentSpend.toLocaleString('tr-TR')}</p>
            </div>
            <div className="h-px bg-slate-700/50" />
            <div>
              <p className="text-slate-500 text-xs">{t('budget.limit')}</p>
              <p className="text-slate-300 font-semibold">₺{goal.monthlyLimit.toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${pct >= 100 ? 'bg-red-500/10 border border-red-500/20' :
            pct >= 85 ? 'bg-amber-500/10 border border-amber-500/20' :
              'bg-emerald-500/10 border border-emerald-500/20'
          }`}>
          {pct >= 100 ? (
            <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
          ) : pct >= 85 ? (
            <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
          )}
          <p className={`text-xs font-medium ${pct >= 100 ? 'text-red-300' : pct >= 85 ? 'text-amber-300' : 'text-emerald-300'
            }`}>
            {over
              ? t('budget.over_budget', { amount: Math.abs(remaining).toLocaleString('tr-TR') })
              : pct >= 85
                ? t('budget.warning_left', { amount: remaining.toLocaleString('tr-TR') })
                : t('budget.remaining', { amount: remaining.toLocaleString('tr-TR') })
            }
          </p>
        </div>

        {/* Sparkline */}
        {sparkData.length > 1 && (
          <div className="mt-4 h-14">
            <p className="text-slate-600 text-[10px] mb-1">{t('budget.trend_6m')}</p>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`grad-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={meta.gradient} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={meta.gradient} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <Tooltip
                  contentStyle={{ background: '#020617', border: '1px solid #334155', borderRadius: 10, fontSize: 11 }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, goal.category === 'total' ? t('budget.total_expense') : t(`budget.${goal.category}`)]}
                />
                <Area type="monotone" dataKey="value" stroke={meta.gradient} strokeWidth={2}
                  fill={`url(#grad-${goal.id})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

// Add/Edit Goal Modal
const GoalModal: React.FC<{
  vehicles: Vehicle[];
  editing: BudgetGoal | null;
  onSave: (goal: Omit<BudgetGoal, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}> = ({ vehicles, editing, onSave, onClose }) => {
  const [vehicleId, setVehicleId] = useState(editing?.vehicleId || 'all');
  const [category, setCategory] = useState<BudgetCategory>(editing?.category || 'total');
  const [limit, setLimit] = useState(editing ? String(editing.monthlyLimit) : '');

  const isValid = limit && !isNaN(Number(limit)) && Number(limit) > 0;
  const { t } = useTranslation(); // In GoalModal

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{editing ? t('budget.edit_goal') : t('budget.new_goal')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <X size={15} className="text-slate-400" />
          </button>
        </div>

        {/* Vehicle */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('budget.vehicle')}</label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setVehicleId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${vehicleId === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              Tüm Araçlar
            </button>
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setVehicleId(v.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${vehicleId === v.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                {v.brand} {v.model}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('budget.category')}</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(CATEGORY_META) as [BudgetCategory, typeof CATEGORY_META[BudgetCategory]][]).map(([key, meta]) => {
              const CatIcon = meta.icon;
              return (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all ${category === key
                      ? `${meta.bg} ${meta.border} border ${meta.color}`
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                >
                  <CatIcon size={16} className={category === key ? meta.color : 'text-slate-500'} />
                  {key === 'total' ? t('budget.total_expense') : t(`budget.${key}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Monthly limit */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('budget.monthly_limit')}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
            <input
              type="number"
              value={limit}
              onChange={e => setLimit(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-800 text-white rounded-xl pl-8 pr-4 py-3.5 text-lg font-bold border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          {/* Quick presets */}
          <div className="flex gap-2 mt-2">
            {[500, 1000, 2000, 5000].map(preset => (
              <button
                key={preset}
                onClick={() => setLimit(String(preset))}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 transition-all"
              >
                ₺{preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!isValid}
          onClick={() => { onSave({ vehicleId, category, monthlyLimit: Number(limit) }); onClose(); }}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-30 hover:bg-indigo-500 transition-all"
        >
          {editing ? t('budget.update') : t('budget.create_goal')}
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const BudgetGoals: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(); // In BudgetGoals

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [goals, setGoals] = useState<BudgetGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<BudgetGoal | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  useEffect(() => {
    const load = async () => {
      const [v, l, bg] = await Promise.all([fetchVehicles(), fetchLogs(), fetchBudgetGoals()]);
      setVehicles(v);
      setLogs(l);
      setGoals(bg);
      setLoading(false);
    };
    load();
  }, []);

  const vehicleNameMap = useMemo(() => {
    const m: Record<string, string> = { all: t('budget.all_vehicles') };
    vehicles.forEach(v => { m[v.id] = `${v.brand} ${v.model}`; });
    return m;
  }, [vehicles]);

  // Current month spend for a vehicle + category
  const getSpend = (vehicleId: string, category: BudgetCategory): number => {
    const filtered = vehicleId === 'all' ? logs : logs.filter(l => l.vehicleId === vehicleId);
    return filtered
      .filter(l => l.date.startsWith(selectedMonth))
      .filter(l => category === 'total' || (LOG_CATEGORY_MAP[l.type] || 'other') === category)
      .reduce((s, l) => s + l.cost, 0);
  };

  // History for sparkline
  const getHistory = (vehicleId: string): MonthlySpend[] =>
    buildMonthlySpends(logs, vehicleId);

  const handleSave = async (data: Omit<BudgetGoal, 'id' | 'createdAt'>) => {
    setLoading(true);
    if (editingGoal) {
      await updateBudgetGoal(editingGoal.id, data);
    } else {
      await addBudgetGoal(data as any);
    }
    const bg = await fetchBudgetGoals();
    setGoals(bg);
    setLoading(false);
    setEditingGoal(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('budget.confirm_delete'))) {
      setLoading(true);
      await deleteBudgetGoal(id);
      const bg = await fetchBudgetGoals();
      setGoals(bg);
      setLoading(false);
    }
  };

  // Summary stats
  const totalSpendThisMonth = useMemo(() =>
    logs.filter(l => l.date.startsWith(selectedMonth)).reduce((s, l) => s + l.cost, 0),
    [logs, selectedMonth]
  );

  const totalBudget = useMemo(() =>
    goals.filter(g => g.category === 'total').reduce((s, g) => s + g.monthlyLimit, 0),
    [goals]
  );

  const overBudgetCount = goals.filter(g => getSpend(g.vehicleId, g.category) > g.monthlyLimit).length;

  // Month picker options (last 6 months)
  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      opts.push({ value: ym, label: getMonthLabel(ym) });
    }
    return opts;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <Target className="text-indigo-400 animate-pulse" size={24} />
          </div>
          <p className="text-slate-400 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
            <ChevronLeft size={20} className="text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{t('budget.title')}</h1>
            <p className="text-slate-500 text-xs">{t('budget.subtitle')}</p>
          </div>
          <button
            onClick={() => { setEditingGoal(null); setShowModal(true); }}
            className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Month selector */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="w-full appearance-none bg-slate-800/60 border border-slate-700/50 text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-indigo-500 pr-10"
          >
            {monthOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Calendar size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Summary strip */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-base">₺{totalSpendThisMonth.toLocaleString('tr-TR')}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{t('budget.this_month_spent')}</p>
            </div>
            <div className={`rounded-xl p-3 text-center border ${totalBudget > 0 && totalSpendThisMonth > totalBudget
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-indigo-500/10 border-indigo-500/20'
              }`}>
              <p className={`font-bold text-base ${totalBudget > 0 && totalSpendThisMonth > totalBudget ? 'text-red-400' : 'text-indigo-400'
                }`}>
                {totalBudget > 0 ? `₺${totalBudget.toLocaleString('tr-TR')}` : '—'}
              </p>
              <p className="text-slate-500 text-[10px] mt-0.5">{t('budget.total_limit')}</p>
            </div>
            <div className={`rounded-xl p-3 text-center border ${overBudgetCount > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
              }`}>
              <p className={`font-bold text-base ${overBudgetCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {overBudgetCount > 0 ? t('budget.exceeded_count', { count: overBudgetCount }) : t('budget.status_good')}
              </p>
              <p className="text-slate-500 text-[10px] mt-0.5">{t('budget.status')}</p>
            </div>
          </div>
        )}

        {/* Goal cards */}
        {goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map(goal => (
              <BudgetCard
                key={goal.id}
                goal={goal}
                vehicleName={vehicleNameMap[goal.vehicleId] || t('budget.unknown')}
                currentSpend={getSpend(goal.vehicleId, goal.category)}
                history={getHistory(goal.vehicleId)}
                onEdit={() => { setEditingGoal(goal); setShowModal(true); }}
                onDelete={() => handleDelete(goal.id)}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
              <Target size={36} className="text-indigo-400" />
            </div>
            <p className="text-white font-bold text-lg mb-2">{t('budget.no_goals_title')}</p>
            <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
              Aylık harcama limitleri belirle, aşım olduğunda uyarı al ve finansal hedeflerine ulaş.
            </p>
            <button
              onClick={() => { setEditingGoal(null); setShowModal(true); }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus size={16} />
              İlk Hedefi Oluştur
            </button>
          </div>
        )}

        {/* Tips */}
        {goals.length > 0 && (
          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/30 p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={13} className="text-indigo-400" />
              <p className="text-slate-300 text-xs font-semibold">{t('budget.tips_title')}</p>
            </div>
            {(t('budget.tips', { returnObjects: true }) as string[]).map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-indigo-400 text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                <p className="text-slate-500 text-xs leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <GoalModal
          vehicles={vehicles}
          editing={editingGoal}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingGoal(null); }}
        />
      )}
    </div>
  );
};
