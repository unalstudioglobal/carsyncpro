import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Calendar, Plus, Clock, Wrench, CheckCircle2,
  AlertTriangle, X, Edit3, Trash2, Bell, Car, MapPin,
  Phone, ChevronRight, Fuel, Shield, Droplet, RotateCw,
  Battery, ClipboardCheck, Sparkles, Disc, BellRing, Check,
  CalendarDays, Timer, Info
} from 'lucide-react';
import {
  fetchVehicles, fetchAppointments,
  addAppointment, updateAppointment, deleteAppointment
} from '../services/firestoreService';
import { Vehicle, Appointment } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RichAppointment extends Appointment {
  vehicleName: string;
  daysUntil: number;
}

type ApptStatus = 'upcoming' | 'today' | 'overdue' | 'completed';
type ViewMode = 'list' | 'calendar';

// ─── Constants ───────────────────────────────────────────────────────────────

const SERVICE_META: Record<string, { key: string; icon: React.ElementType; color: string; bg: string; border: string; estimatedCost: string }> = {
  'Yağ Değişimi': { key: 'oil_change', icon: Droplet, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', estimatedCost: '₺800-1.500' },
  'Periyodik Bakım': { key: 'periodic', icon: Wrench, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', estimatedCost: '₺2.000-5.000' },
  'Lastik Değişimi': { key: 'tire_change', icon: Disc, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', estimatedCost: '₺4.000-12.000' },
  'Lastik Rotasyonu': { key: 'tire_rotation', icon: RotateCw, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', estimatedCost: '₺200-400' },
  'Fren Servisi': { key: 'brake', icon: Wrench, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', estimatedCost: '₺1.500-4.000' },
  'Akü Değişimi': { key: 'battery', icon: Battery, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', estimatedCost: '₺1.200-2.500' },
  'Muayene': { key: 'inspection', icon: ClipboardCheck, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20', estimatedCost: '₺400-700' },
  'Yıkama & Detay': { key: 'detailing', icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', estimatedCost: '₺500-2.000' },
  'Genel Kontrol': { key: 'general', icon: Shield, color: 'text-green-400', bg: 'bg-blue-500/10', border: 'border-green-500/20', estimatedCost: '₺500-1.000' }, // Corrected color for key consistency
  'Diğer': { key: 'other', icon: Wrench, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', estimatedCost: '—' },
};

const getMeta = (type: string) => SERVICE_META[type] ?? SERVICE_META['Diğer'];

// Removed hardcoded date constants to use localized Date methods

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getDaysUntil = (dateStr: string): number => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
};

const formatDate = (dateStr: string, i18n: any) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getApptStatus = (appt: Appointment): ApptStatus => {
  if (appt.status === 'Completed') return 'completed';
  const days = getDaysUntil(appt.date);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  return 'upcoming';
};

const STATUS_CONFIG = (t: any): Record<ApptStatus, { label: string; color: string; bg: string; border: string; dotColor: string }> => ({
  upcoming: { label: t('appt.upcoming'), color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dotColor: 'bg-blue-500' },
  today: { label: t('appt.today_alert'), color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dotColor: 'bg-emerald-500 animate-pulse' },
  overdue: { label: t('appt.overdue'), color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dotColor: 'bg-red-500' },
  completed: { label: t('appt.completed'), color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-700/30', dotColor: 'bg-slate-500' },
});

// Helpers removed - using unified Appointment type

// ─── Add/Edit Modal ──────────────────────────────────────────────────────────

const ApptModal: React.FC<{
  vehicles: Vehicle[];
  editing: Appointment | null;
  onSave: (appt: Omit<Appointment, 'id'>) => void;
  onClose: () => void;
}> = ({ vehicles, editing, onSave, onClose }) => {
  const { t } = useTranslation();
  const [vehicleId, setVehicleId] = useState(editing?.vehicleId || vehicles[0]?.id || '');
  const [serviceType, setServiceType] = useState(editing?.serviceType || 'Yağ Değişimi');
  const [date, setDate] = useState(editing?.date || '');
  const [location, setLocation] = useState(editing?.location || '');
  const [phone, setPhone] = useState(editing?.phone || '');
  const [reminderDays, setReminderDays] = useState(editing?.reminderDays ?? 3);
  const [notes, setNotes] = useState(editing?.notes || '');

  const meta = getMeta(serviceType);
  const isValid = vehicleId && serviceType && date;

  // Auto-suggest earliest available date (next weekday)
  useEffect(() => {
    if (!date) {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      if (d.getDay() === 0) d.setDate(d.getDate() + 1);
      if (d.getDay() === 6) d.setDate(d.getDate() + 2);
      setDate(d.toISOString().slice(0, 10));
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{editing ? t('appt.modal_edit') : t('appt.modal_new')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <X size={15} className="text-slate-400" />
          </button>
        </div>

        {/* Vehicle */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('appt.car')}</label>
          <div className="flex gap-2 flex-wrap">
            {vehicles.map(v => (
              <button key={v.id} onClick={() => setVehicleId(v.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${vehicleId === v.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                <Car size={11} />{v.brand} {v.model}
              </button>
            ))}
          </div>
        </div>

        {/* Service type */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('appt.service_type')}</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(SERVICE_META).map(([key, m]) => {
              const SIcon = m.icon;
              return (
                <button key={key} onClick={() => setServiceType(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${serviceType === key ? `${m.bg} ${m.border} border ${m.color}` : 'bg-slate-800 text-slate-500 border border-slate-700/50'}`}>
                  <SIcon size={13} className={serviceType === key ? m.color : 'text-slate-600'} />
                  <span className="truncate">{t(`appt.service_items.${m.key}`)}</span>
                </button>
              );
            })}
          </div>
          {/* Cost estimate */}
          <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
            <Info size={10} /> {t('appt.est_cost')} <span className="text-slate-300 font-semibold">{meta.estimatedCost}</span>
          </p>
        </div>

        {/* Date */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('appt.date')}</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>

        {/* Location + Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('appt.location')}</label>
            <input value={location} onChange={e => setLocation(e.target.value)}
              placeholder={t('appt.location_ph')}
              className="w-full bg-slate-800 text-white rounded-xl px-3 py-2.5 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
          </div>
          <div>
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('appt.phone')}</label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="0212 000 00 00"
              className="w-full bg-slate-800 text-white rounded-xl px-3 py-2.5 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
          </div>
        </div>

        {/* Reminder */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
            {t('appt.reminder')} <span className="text-blue-400 font-bold">{t('appt.days_before', { days: reminderDays })}</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 5, 7].map(d => (
              <button key={d} onClick={() => setReminderDays(d)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${reminderDays === d ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {d}g
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">{t('appt.notes')}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder={t('appt.notes_ph')}
            rows={2}
            className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 resize-none placeholder:text-slate-600" />
        </div>

        <button disabled={!isValid}
          onClick={() => {
            onSave({ 
                vehicleId, 
                serviceType, 
                date, 
                status: editing?.status || 'Pending', 
                notes,
                location,
                phone,
                reminderDays,
                estimatedCost: meta.estimatedCost
            });
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm disabled:opacity-30 hover:bg-blue-500 transition-all">
          {editing ? t('appt.btn_update') : t('appt.modal_new')}
        </button>
      </div>
    </div>
  );
};

// ─── Appointment Card ────────────────────────────────────────────────────────

const ApptCard: React.FC<{
  appt: RichAppointment;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
}> = ({ appt, onEdit, onDelete, onComplete }) => {
  const { t } = useTranslation();
  const meta = getMeta(appt.serviceType);
  const status = getApptStatus(appt);
  const scfg = STATUS_CONFIG(t)[status];
  const Icon = meta.icon;
  const days = appt.daysUntil;

  const daysLabel =
    status === 'completed' ? t('appt.completed') :
      status === 'overdue' ? t('appt.days_overdue', { days: Math.abs(days) }) :
        status === 'today' ? t('appt.today_alert') :
          days === 1 ? t('appt.tomorrow') :
            t('appt.days_left', { days });

  const { i18n } = useTranslation();

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${status === 'completed' ? 'bg-slate-800/15 border-slate-700/15 opacity-60' :
      status === 'overdue' ? 'bg-red-500/8 border-red-500/25' :
        status === 'today' ? 'bg-emerald-500/8 border-emerald-500/30' :
          `${meta.bg} ${meta.border}`
      }`}>
      {/* Status strip */}
      <div className={`h-1 w-full ${status === 'completed' ? 'bg-slate-600' :
        status === 'overdue' ? 'bg-red-500' :
          status === 'today' ? 'bg-emerald-500' : 'bg-blue-500'
        }`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg} border ${meta.border}`}>
            <Icon size={18} className={meta.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className={`font-bold text-sm ${status === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>
                {t(`appt.service_items.${meta.key}`)}
              </p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${scfg.bg} ${scfg.color} border ${scfg.border}`}>
                {scfg.label}
              </span>
            </div>
            <p className="text-slate-500 text-xs">{appt.vehicleName}</p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {status !== 'completed' && (
              <button onClick={onComplete} className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center hover:bg-emerald-500/20 transition-all" title="Tamamlandı">
                <Check size={12} className="text-slate-400" />
              </button>
            )}
            <button onClick={onEdit} className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center hover:bg-slate-600 transition-all">
              <Edit3 size={11} className="text-slate-400" />
            </button>
            <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center hover:bg-red-500/20 transition-all">
              <Trash2 size={11} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Date row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={11} />
            {formatDate(appt.date, i18n)}
          </div>
          <span className={`text-xs font-bold ${scfg.color}`}>{daysLabel}</span>
        </div>

        {/* Details row */}
        <div className="flex items-center gap-3 flex-wrap">
          {appt.location && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={10} />
              <span className="truncate max-w-28">{appt.location}</span>
            </div>
          )}
          {appt.phone && (
            <a href={`tel:${appt.phone}`} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
              <Phone size={10} />
              {appt.phone}
            </a>
          )}
          {appt.estimatedCost !== '—' && (
            <span className="text-xs text-slate-500 ml-auto">{appt.estimatedCost}</span>
          )}
        </div>

        {/* Reminder badge */}
        {status !== 'completed' && days > 0 && appt.reminderDays && days <= appt.reminderDays && (
          <div className="mt-3 flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
            <BellRing size={12} className="text-blue-400 animate-pulse flex-shrink-0" />
            <p className="text-blue-300 text-xs font-medium">{t('appt.reminder_active', { days })}</p>
          </div>
        )}

        {appt.notes && (
          <p className="text-slate-600 text-xs mt-2 leading-relaxed">{appt.notes}</p>
        )}
      </div>
    </div>
  );
};

// Mini calendar component
const MiniCalendar: React.FC<{ appointments: Appointment[] }> = ({ appointments }) => {
  const { t, i18n } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const { year, month } = currentMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const apptDates = new Set(
    appointments
      .filter(a => a.status !== 'Completed')
      .map(a => a.date)
  );

  const overdueDates = new Set(
    appointments
      .filter(a => a.status !== 'Completed' && getDaysUntil(a.date) < 0)
      .map(a => a.date)
  );

  const prevMonth = () => setCurrentMonth(p => {
    if (p.month === 0) return { year: p.year - 1, month: 11 };
    return { year: p.year, month: p.month - 1 };
  });
  const nextMonth = () => setCurrentMonth(p => {
    if (p.month === 11) return { year: p.year + 1, month: 0 };
    return { year: p.year, month: p.month + 1 };
  });

  const cells = Array.from({ length: (firstDay === 0 ? 6 : firstDay - 1) + daysInMonth }, (_, i) => {
    const dayNum = i - (firstDay === 0 ? 6 : firstDay - 1) + 1;
    return dayNum > 0 ? dayNum : null;
  });

  return (
    <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center">
          <ChevronLeft size={14} className="text-slate-400" />
        </button>
        <p className="text-white font-bold text-sm">
          {new Date(year, month).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' })}
        </p>
        <button onClick={nextMonth} className="w-7 h-7 rounded-lg bg-slate-700/60 flex items-center justify-center">
          <ChevronRight size={14} className="text-slate-400" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {(i18n.language === 'tr' ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map(d => (
          <div key={d} className="text-center text-slate-600 text-[10px] font-semibold py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = new Date(dateStr + 'T00:00:00').getTime() === today.getTime();
          const hasAppt = apptDates.has(dateStr);
          const isOverdue = overdueDates.has(dateStr);
          return (
            <div key={i} className={`relative flex items-center justify-center rounded-lg text-xs font-medium h-8 transition-all ${isToday ? 'bg-blue-600 text-white' :
              hasAppt ? (isOverdue ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/15 text-blue-300') :
                'text-slate-400 hover:bg-slate-700/40'
              }`}>
              {day}
              {hasAppt && !isToday && (
                <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isOverdue ? 'bg-red-400' : 'bg-blue-400'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/30">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-slate-500 text-[10px]">{t('appt.legend_appt')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-slate-500 text-[10px]">{t('appt.legend_overdue')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-4 rounded bg-blue-600" />
          <span className="text-slate-500 text-[10px]">{t('appt.legend_today')}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const ServiceAppointment: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<'active' | 'all' | 'completed'>('active');

  useEffect(() => {
    const load = async () => {
      const [v, a] = await Promise.all([fetchVehicles(), fetchAppointments()]);
      setVehicles(v);
      setAppts(a);
      setLoading(false);
    };
    load();
  }, []);

  const vehicleMap = useMemo(() => {
    const m: Record<string, string> = {};
    vehicles.forEach(v => { m[v.id] = `${v.brand} ${v.model}`; });
    return m;
  }, [vehicles]);

  const richAppts: RichAppointment[] = useMemo(() =>
    appts.map(a => ({
        ...a,
        vehicleName: vehicleMap[a.vehicleId] || 'Bilinmiyor',
        daysUntil: getDaysUntil(a.date),
    })).sort((a, b) => a.date.localeCompare(b.date)),
    [appts, vehicleMap]
  );

  const filtered = useMemo(() => richAppts.filter(a => {
    if (filterStatus === 'active') return a.status !== 'Completed';
    if (filterStatus === 'completed') return a.status === 'Completed';
    return true;
  }), [richAppts, filterStatus]);

  // Stats
  const stats = useMemo(() => ({
    total: richAppts.filter(a => a.status !== 'Completed').length,
    today: richAppts.filter(a => getApptStatus(a) === 'today').length,
    overdue: richAppts.filter(a => getApptStatus(a) === 'overdue').length,
    upcoming: richAppts.filter(a => getApptStatus(a) === 'upcoming').length,
  }), [richAppts]);

  const handleSave = async (data: Omit<Appointment, 'id'>) => {
    if (editing) {
      await updateAppointment(editing.id, data);
      setAppts(prev => prev.map(a => a.id === editing.id ? { ...a, ...data } : a));
    } else {
      const id = await addAppointment(data);
      const newAppt: Appointment = { ...data, id };
      setAppts(prev => [...prev, newAppt]);
    }
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await deleteAppointment(id);
    setAppts(prev => prev.filter(a => a.id !== id));
  };

  const handleComplete = async (id: string) => {
    await updateAppointment(id, { status: 'Completed' });
    setAppts(prev => prev.map(a => a.id === id ? { ...a, status: 'Completed' } : a));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
            <Calendar className="text-blue-400 animate-pulse" size={24} />
          </div>
          <p className="text-slate-400 text-sm">{t('appt.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
            <ChevronLeft size={20} className="text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{t('appt.title')}</h1>
            <p className="text-slate-500 text-xs">{t('appt.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(m => m === 'list' ? 'calendar' : 'list')}
              className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center"
            >
              {viewMode === 'list'
                ? <CalendarDays size={16} className="text-slate-400" />
                : <Timer size={16} className="text-slate-400" />}
            </button>
            <button
              onClick={() => { setEditing(null); setShowModal(true); }}
              className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20"
            >
              <Plus size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex bg-slate-800/40 rounded-2xl p-1 border border-slate-700/30">
          {([
            { key: 'active', label: t('appt.filter_active', { count: stats.total }) },
            { key: 'completed', label: t('appt.completed') },
            { key: 'all', label: t('appt.filter_all') },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setFilterStatus(key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${filterStatus === key ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Alert banners */}
        {stats.overdue > 0 && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-3.5 flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm font-semibold">{t('appt.alert_overdue', { count: stats.overdue })}</p>
          </div>
        )}
        {stats.today > 0 && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-center gap-3">
            <BellRing size={18} className="text-emerald-400 animate-pulse flex-shrink-0" />
            <p className="text-emerald-300 text-sm font-semibold">{t('appt.alert_today', { count: stats.today })}</p>
          </div>
        )}

        {/* Stats row */}
        {appts.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t('appt.stat_upcoming'), value: stats.upcoming, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              { label: t('appt.overdue'), value: stats.overdue, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
              { label: t('appt.stat_today'), value: stats.today, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} className={`rounded-xl ${bg} border ${border} p-3 text-center`}>
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Calendar view */}
        {viewMode === 'calendar' && (
          <MiniCalendar appointments={appts} />
        )}

        {/* List */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(a => (
              <ApptCard
                key={a.id}
                appt={a}
                onEdit={() => { setEditing(a); setShowModal(true); }}
                onDelete={() => handleDelete(a.id)}
                onComplete={() => handleComplete(a.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center mb-5">
              <Calendar size={36} className="text-slate-600" />
            </div>
            <p className="text-white font-bold text-lg mb-2">{t('appt.no_appt')}</p>
            <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
              {t('appt.no_appt_desc')}
            </p>
            <button
              onClick={() => { setEditing(null); setShowModal(true); }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus size={16} />
              {t('appt.btn_first')}
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <ApptModal
          vehicles={vehicles}
          editing={editing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
};
