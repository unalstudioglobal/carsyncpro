import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Shield, ClipboardCheck, Plus, Bell, Calendar,
  AlertTriangle, CheckCircle2, Clock, X, Edit3, Trash2, Car,
  ChevronRight, FileText, Zap, Wrench, Info, RefreshCw
} from 'lucide-react';
import { fetchVehicles, fetchAppointments, addAppointment, updateAppointment, deleteAppointment } from '../services/firestoreService';
import { Vehicle } from '../types';
import { getSetting, saveSetting } from '../services/settingsService';

// ─── Types ───────────────────────────────────────────────────────────────────

type DocumentType =
  | 'Trafik Sigortası'
  | 'Kasko'
  | 'Araç Muayenesi'
  | 'Egzoz Muayenesi'
  | 'MTV Ödemesi'
  | 'Lastik Değişimi'
  | 'Yıllık Bakım'
  | 'Özel';

type UrgencyLevel = 'expired' | 'critical' | 'warning' | 'ok';

interface CalendarEvent {
  id: string;
  vehicleId: string;
  type: DocumentType;
  expiryDate: string;       // YYYY-MM-DD
  reminderDays: number;
  notes: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DOC_META: Record<DocumentType, { icon: React.ElementType; color: string; bg: string; border: string; renewalMonths: number; description: string }> = {
  'Trafik Sigortası': { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', renewalMonths: 12, description: 'Zorunlu trafik sigortası' },
  'Kasko': { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', renewalMonths: 12, description: 'Kasko poliçesi' },
  'Araç Muayenesi': { icon: ClipboardCheck, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', renewalMonths: 24, description: 'Periyodik araç muayenesi' },
  'Egzoz Muayenesi': { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', renewalMonths: 12, description: 'Egzoz emisyon muayenesi' },
  'MTV Ödemesi': { icon: FileText, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', renewalMonths: 6, description: 'Motorlu taşıtlar vergisi' },
  'Lastik Değişimi': { icon: RefreshCw, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', renewalMonths: 6, description: 'Mevsimsel lastik değişimi' },
  'Yıllık Bakım': { icon: Wrench, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', renewalMonths: 12, description: 'Yıllık servis bakımı' },
  'Özel': { icon: Calendar, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', renewalMonths: 12, description: 'Özel hatırlatma' },
};

const URGENCY_CONFIG: Record<UrgencyLevel, { labelKey: string; color: string; bg: string; border: string; dotColor: string }> = {
  expired: { labelKey: 'ins.stat_expired', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dotColor: 'bg-red-500' },
  critical: { labelKey: 'ins.stat_critical', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dotColor: 'bg-orange-500' },
  warning: { labelKey: 'ins.stat_warning', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dotColor: 'bg-amber-500' },
  ok: { labelKey: 'ins.stat_ok', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dotColor: 'bg-emerald-500' },
};

const LS_KEY = 'carsync_calendar_events';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const loadEvents = (): CalendarEvent[] => {
  return getSetting<CalendarEvent[]>('insuranceEvents', []);
};
const saveEvents = (events: CalendarEvent[]) =>
  saveSetting('insuranceEvents', events);

const getDaysUntil = (dateStr: string): number => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
};

const getUrgency = (daysUntil: number, reminderDays: number): UrgencyLevel => {
  if (daysUntil < 0) return 'expired';
  if (daysUntil <= 14) return 'critical';
  if (daysUntil <= reminderDays) return 'warning';
  return 'ok';
};

const formatDate = (dateStr: string, t: any) => {
  const d = new Date(dateStr + 'T00:00:00');
  const months = t('ins.months', { returnObjects: true }) as string[];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatDaysLabel = (days: number, t: any): string => {
  if (days < 0) return t('ins.days_passed', { d: Math.abs(days) });
  if (days === 0) return t('ins.days_today');
  if (days === 1) return t('ins.days_tmrw');
  if (days < 30) return t('ins.days_left', { d: days });
  const months = Math.floor(days / 30);
  const rem = days % 30;
  return rem > 0 ? t('ins.months_days_left', { m: months, d: rem }) : t('ins.months_left', { m: months });
};

// ─── Sub Components ──────────────────────────────────────────────────────────

const EventCard: React.FC<{
  event: CalendarEvent;
  vehicleName: string;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
  t: any;
}> = ({ event, vehicleName, onEdit, onDelete, onComplete, t }) => {
  const meta = DOC_META[event.type] || DOC_META['Özel'];
  const Icon = meta.icon;
  const days = getDaysUntil(event.expiryDate);
  const urgency = getUrgency(days, event.reminderDays);
  const ucfg = URGENCY_CONFIG[urgency];
  const isCompleted = event.status === 'Completed';

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${isCompleted
      ? 'bg-slate-800/20 border-slate-700/20 opacity-60'
      : `${meta.bg} ${meta.border}`
      }`}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg} border ${meta.border}`}>
            <Icon size={18} className={isCompleted ? 'text-slate-500' : meta.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className={`font-semibold text-sm ${isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
                {event.type}
              </p>
              {!isCompleted && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ucfg.bg} ${ucfg.color} border ${ucfg.border}`}>
                  {t(ucfg.labelKey)}
                </span>
              )}
              {isCompleted && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-700 text-slate-400">
                  {t('ins.completed')}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs">{vehicleName}</p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {!isCompleted && (
              <button onClick={onComplete} className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center hover:bg-emerald-500/20 transition-all" title={t('ins.mark_completed')}>
                <CheckCircle2 size={13} className="text-slate-400" />
              </button>
            )}
            <button onClick={onEdit} className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center hover:bg-slate-600 transition-all">
              <Edit3 size={12} className="text-slate-400" />
            </button>
            <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center hover:bg-red-500/20 transition-all">
              <Trash2 size={12} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Date + countdown */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={11} />
            <span>{formatDate(event.expiryDate, t)}</span>
          </div>
          {!isCompleted && (
            <span className={`text-xs font-bold ${ucfg.color}`}>
              {formatDaysLabel(days, t)}
            </span>
          )}
        </div>

        {/* Progress bar for non-expired */}
        {!isCompleted && days >= 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${urgency === 'expired' || urgency === 'critical' ? 'bg-red-500' :
                  urgency === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                style={{ width: `${Math.max(5, Math.min(100, 100 - (days / (event.reminderDays * 2)) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <p className="text-slate-500 text-xs mt-2 leading-relaxed">{event.notes}</p>
        )}

        {/* Action button for expired/critical */}
        {!isCompleted && (urgency === 'expired' || urgency === 'critical') && (
          <button
            onClick={onEdit}
            className={`mt-3 w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${urgency === 'expired'
              ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30'
              }`}
          >
            <RefreshCw size={12} />
            {urgency === 'expired' ? t('ins.renew') : t('ins.update_date')}
          </button>
        )}
      </div>
    </div>
  );
};

// Add/Edit Modal
const EventModal: React.FC<{
  vehicles: Vehicle[];
  editing: CalendarEvent | null;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  onClose: () => void;
  t: any;
}> = ({ vehicles, editing, onSave, onClose, t }) => {
  const [vehicleId, setVehicleId] = useState(editing?.vehicleId || (vehicles[0]?.id ?? ''));
  const [type, setType] = useState<DocumentType>(editing?.type || 'Trafik Sigortası');
  const [expiryDate, setExpiryDate] = useState(editing?.expiryDate || '');
  const [reminderDays, setReminderDays] = useState(editing?.reminderDays ?? 30);
  const [notes, setNotes] = useState(editing?.notes || '');

  // Auto-fill next year when type changes
  const autoFillDate = (docType: DocumentType) => {
    if (!expiryDate) {
      const d = new Date();
      d.setMonth(d.getMonth() + DOC_META[docType].renewalMonths);
      setExpiryDate(d.toISOString().slice(0, 10));
    }
    setType(docType);
  };

  const isValid = vehicleId && expiryDate;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{editing ? t('ins.modal_edit') : t('ins.modal_new')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <X size={15} className="text-slate-400" />
          </button>
        </div>

        {/* Vehicle */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('ins.modal_car')}</label>
          <div className="flex gap-2 flex-wrap">
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setVehicleId(v.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${vehicleId === v.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
              >
                <Car size={11} />
                {v.brand} {v.model}
              </button>
            ))}
          </div>
        </div>

        {/* Document type */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('ins.modal_type')}</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(DOC_META) as [DocumentType, typeof DOC_META[DocumentType]][]).map(([key, meta]) => {
              const DocIcon = meta.icon;
              return (
                <button
                  key={key}
                  onClick={() => autoFillDate(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${type === key
                    ? `${meta.bg} ${meta.border} border ${meta.color}`
                    : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                    }`}
                >
                  <DocIcon size={13} className={type === key ? meta.color : 'text-slate-600'} />
                  <span className="truncate">{t('ins.type_' + key)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expiry date */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('ins.modal_expiry')}</label>
          <input
            type="date"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-sm border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Reminder days */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
            {t('ins.modal_rem_days')}: <span className="text-white font-bold">{t('ins.modal_rem_val', { d: reminderDays })}</span>
          </label>
          <div className="flex gap-2 mb-2">
            {[7, 14, 30, 60, 90].map(d => (
              <button
                key={d}
                onClick={() => setReminderDays(d)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${reminderDays === d ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
              >
                {d}g
              </button>
            ))}
          </div>
          <input
            type="range"
            min={7} max={90} step={1}
            value={reminderDays}
            onChange={e => setReminderDays(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('ins.modal_notes')}</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t('ins.modal_notes_ph')}
            rows={2}
            className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-sm border border-slate-700 focus:outline-none focus:border-indigo-500 resize-none transition-colors placeholder:text-slate-600"
          />
        </div>

        <button
          disabled={!isValid}
          onClick={() => {
            onSave({ vehicleId, type, expiryDate, reminderDays, notes, status: editing?.status || 'Pending' });
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-30 hover:bg-indigo-500 transition-all"
        >
          {editing ? t('ins.modal_btn_edit') : t('ins.modal_btn_add')}
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const InsuranceCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'active' | 'completed' | 'all'>('active');

  useEffect(() => {
    const load = async () => {
      const v = await fetchVehicles();
      setVehicles(v);
      setEvents(loadEvents());
      setLoading(false);
    };
    load();
  }, []);

  const vehicleNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    vehicles.forEach(v => { m[v.id] = `${v.brand} ${v.model}`; });
    return m;
  }, [vehicles]);

  const handleSave = (data: Omit<CalendarEvent, 'id'>) => {
    if (editingEvent) {
      const updated = events.map(e => e.id === editingEvent.id ? { ...e, ...data } : e);
      setEvents(updated); saveEvents(updated);
    } else {
      const newEvent: CalendarEvent = { ...data, id: Date.now().toString() };
      const updated = [...events, newEvent];
      setEvents(updated); saveEvents(updated);
    }
    setEditingEvent(null);
  };

  const handleDelete = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated); saveEvents(updated);
  };

  const handleComplete = (id: string) => {
    const updated = events.map(e => e.id === id ? { ...e, status: 'Completed' as const } : e);
    setEvents(updated); saveEvents(updated);
  };

  // Filtered + sorted events
  const filteredEvents = useMemo(() => {
    return events
      .filter(e => filterVehicle === 'all' || e.vehicleId === filterVehicle)
      .filter(e => {
        if (filterStatus === 'active') return e.status !== 'Completed';
        if (filterStatus === 'completed') return e.status === 'Completed';
        return true;
      })
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  }, [events, filterVehicle, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const active = events.filter(e => e.status !== 'Completed');
    const expired = active.filter(e => getDaysUntil(e.expiryDate) < 0).length;
    const critical = active.filter(e => { const d = getDaysUntil(e.expiryDate); return d >= 0 && d <= 14; }).length;
    const warning = active.filter(e => { const d = getDaysUntil(e.expiryDate); return d > 14 && d <= e.reminderDays; }).length;
    return { total: active.length, expired, critical, warning };
  }, [events]);

  // Group events by month
  const groupedEvents = useMemo<Record<string, CalendarEvent[]>>(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach(e => {
      const d = new Date(e.expiryDate + 'T00:00:00');
      const months = t('ins.months', { returnObjects: true }) as string[];
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return groups;
  }, [filteredEvents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
            <Shield className="text-blue-400 animate-pulse" size={24} />
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
            <h1 className="text-lg font-bold text-white">{t('ins.title')}</h1>
            <p className="text-slate-500 text-xs">{t('ins.subtitle')}</p>
          </div>
          <button
            onClick={() => { setEditingEvent(null); setShowModal(true); }}
            className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Alert strip */}
        {(stats.expired > 0 || stats.critical > 0) && (
          <div className={`rounded-2xl border p-4 flex items-center gap-3 ${stats.expired > 0
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-orange-500/10 border-orange-500/30'
            }`}>
            <AlertTriangle size={20} className={stats.expired > 0 ? 'text-red-400' : 'text-orange-400'} />
            <div>
              <p className={`font-bold text-sm ${stats.expired > 0 ? 'text-red-300' : 'text-orange-300'}`}>
                {stats.expired > 0
                  ? t('ins.alert_expired', { c: stats.expired })
                  : t('ins.alert_critical', { c: stats.critical })
                }
              </p>
              <p className="text-slate-500 text-xs">{t('ins.alert_desc')}</p>
            </div>
          </div>
        )}

        {/* Stats bar */}
        {events.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: t('ins.stat_total'), value: stats.total, color: 'text-white', bg: 'bg-slate-800/50', border: 'border-slate-700/30' },
              { label: 'Süresi Doldu', value: stats.expired, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
              { label: 'Kritik', value: stats.critical, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
              { label: t('ins.stat_warning'), value: stats.warning, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} className={`rounded-xl ${bg} border ${border} p-2.5 text-center`}>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-slate-600 text-[10px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {events.length > 0 && (
          <div className="space-y-2">
            {/* Vehicle filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setFilterVehicle('all')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterVehicle === 'all' ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                  }`}
              >
                {t('ins.filter_all_cars')}
              </button>
              {vehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => setFilterVehicle(v.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterVehicle === v.id ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                    }`}
                >
                  {v.brand} {v.model}
                </button>
              ))}
            </div>
            {/* Status filter */}
            <div className="flex gap-2">
              {([
                { key: 'active', label: t('ins.filter_active') },
                { key: 'completed', label: t('ins.filter_completed') },
                { key: 'all', label: t('ins.filter_all') },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${filterStatus === key ? 'bg-slate-700 text-white' : 'bg-slate-800/60 text-slate-500 border border-slate-700/40'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Events grouped by month */}
        {Object.keys(groupedEvents).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([monthLabel, monthEvents]) => {
              const events = monthEvents as CalendarEvent[];
              return (
                <div key={monthLabel}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center">
                      <Calendar size={12} className="text-slate-400" />
                    </div>
                    <p className="text-slate-300 text-sm font-bold">{monthLabel}</p>
                    <div className="flex-1 h-px bg-slate-800" />
                    <p className="text-slate-600 text-xs">{t('ins.doc_count', { c: events.length })}</p>
                  </div>
                  <div className="space-y-3">
                    {events.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        vehicleName={vehicleNameMap[event.vehicleId] || t('ins.unknown')}
                        onEdit={() => { setEditingEvent(event); setShowModal(true); }}
                        onDelete={() => handleDelete(event.id)}
                        onComplete={() => handleComplete(event.id)}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : events.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
              <Shield size={36} className="text-blue-400" />
            </div>
            <p className="text-white font-bold text-lg mb-2">{t('ins.empty_title')}</p>
            <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
              {t('ins.empty_desc')}
            </p>
            <button
              onClick={() => { setEditingEvent(null); setShowModal(true); }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus size={16} />
              {t('ins.empty_btn')}
            </button>

            {/* Type chips preview */}
            <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-xs">
              {Object.keys(DOC_META).slice(0, 6).map(k => (
                <span key={k} className="text-xs bg-slate-800 text-slate-500 px-2.5 py-1 rounded-full border border-slate-700/50">{k}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-500 text-sm">{t('ins.empty_filter')}</p>
          </div>
        )}

        {/* Info note */}
        {events.length > 0 && (
          <div className="flex items-start gap-2 bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
            <Info size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-slate-500 text-xs leading-relaxed">
              {t('ins.info')}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <EventModal
          vehicles={vehicles}
          editing={editingEvent}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
          t={t}
        />
      )}
    </div>
  );
};
