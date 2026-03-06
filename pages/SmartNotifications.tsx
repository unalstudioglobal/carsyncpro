import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from '../services/toast';
import { requestPushPermission, getPushPermissionStatus } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';
import {
  Bell, Settings, ArrowLeft, Plus, X, Phone, User, Calendar as Cal, Wrench, Shield, Droplet, Hash, PlusCircle,
  AlertTriangle, Info, CheckCircle2, Fuel, Gauge, Zap, Sparkles, RotateCw, Battery, ClipboardCheck, TrendingUp,
  ChevronRight, ChevronLeft, BellRing, BellOff, RefreshCw, CheckCheck, Trash2
} from 'lucide-react';
import { fetchVehicles, fetchLogs } from '../services/firestoreService';
import { Vehicle, ServiceLog } from '../types';
import { getSetting, saveSetting } from '../services/settingsService';

// ─── Types ───────────────────────────────────────────────────────────────────

type NotifType = 'critical' | 'warning' | 'info' | 'success' | 'reminder';
type NotifCategory = 'maintenance' | 'fuel' | 'insurance' | 'budget' | 'system' | 'achievement';

interface SmartNotif {
  id: string;
  type: NotifType;
  category: NotifCategory;
  title: string;
  message: string;
  vehicleId?: string;
  vehicleName?: string;
  actionRoute?: string;
  actionLabel?: string;
  createdAt: string;
  read: boolean;
  dismissed: boolean;
  ruleId: string;
}

interface NotifRule {
  id: string;
  label: string;
  description: string;
  category: NotifCategory;
  icon: React.ElementType;
  enabled: boolean;
}

type FilterType = 'all' | 'unread' | NotifType | NotifCategory;

// ─── Constants ───────────────────────────────────────────────────────────────

const NOTIF_CONFIG: Record<NotifType, {
  color: string; bg: string; border: string;
  iconColor: string; icon: React.ElementType; dotColor: string
}> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/25', iconColor: 'text-red-400', icon: AlertTriangle, dotColor: 'bg-red-500' },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25', iconColor: 'text-amber-400', icon: AlertTriangle, dotColor: 'bg-amber-500' },
  info: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', iconColor: 'text-blue-400', icon: Info, dotColor: 'bg-blue-500' },
  success: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', iconColor: 'text-emerald-400', icon: CheckCircle2, dotColor: 'bg-emerald-500' },
  reminder: { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', iconColor: 'text-violet-400', icon: Bell, dotColor: 'bg-violet-500' },
};

const CAT_ICONS: Record<NotifCategory, React.ElementType> = {
  maintenance: Wrench, fuel: Fuel, insurance: Shield,
  budget: Gauge, system: Zap, achievement: Sparkles,
};

const LS_NOTIFS = 'carsync_smart_notifs';
const LS_RULES = 'carsync_notif_rules';

const DEFAULT_RULES: NotifRule[] = [
  { id: 'oil_due', label: 'Yağ Değişimi', description: 'Son yağ değişiminin üzerinden 10.000+ km geçtiyse', category: 'maintenance', icon: Droplet, enabled: true },
  { id: 'service_due', label: 'Periyodik Bakım', description: 'Son bakımın üzerinden 15.000+ km geçtiyse', category: 'maintenance', icon: Wrench, enabled: true },
  { id: 'tire_due', label: 'Lastik Rotasyonu', description: 'Son rotasyonun üzerinden 10.000+ km geçtiyse', category: 'maintenance', icon: RotateCw, enabled: true },
  { id: 'brake_due', label: 'Fren Kontrolü', description: 'Son fren servisinin üzerinden 30.000+ km geçtiyse', category: 'maintenance', icon: Wrench, enabled: true },
  { id: 'battery_due', label: 'Akü Uyarısı', description: 'Son akü değişiminin üzerinden 60.000+ km geçtiyse', category: 'maintenance', icon: Battery, enabled: true },
  { id: 'inspection_due', label: 'Muayene Hatırlatma', description: 'Araç muayenesi 2 yılı aştıysa', category: 'insurance', icon: ClipboardCheck, enabled: true },
  { id: 'low_health', label: 'Düşük Sağlık Skoru', description: 'Araç sağlık skoru 50\'nin altına düştüyse', category: 'system', icon: TrendingUp, enabled: true },
  { id: 'no_fuel_log', label: 'Yakıt Takibi', description: '30 gün içinde yakıt kaydı girilmediyse', category: 'fuel', icon: Fuel, enabled: false },
  { id: 'high_cost', label: 'Bütçe Uyarısı', description: 'Aylık harcama 5.000 TL\'yi aştıysa', category: 'budget', icon: Gauge, enabled: true },
  { id: 'achievement', label: 'Başarılar', description: 'Kilometre ve bakım başarıları için kutlama bildirimi', category: 'achievement', icon: Sparkles, enabled: true },
];



// ─── Helpers ─────────────────────────────────────────────────────────────────

const loadNotifs = (): SmartNotif[] => {
  return getSetting<SmartNotif[]>('smartNotifsList', []);
};
const saveNotifs = (n: SmartNotif[]) => saveSetting('smartNotifsList', n);

const loadRules = (t: any): NotifRule[] => {
  try {
    const saved = getSetting<NotifRule[]>('smartNotifRules', []);
    if (!saved.length) return DEFAULT_RULES.map(r => ({ ...r, label: t(`smart_notifs.rule_${r.id.replace('_due', '').replace('_log', '')}`) || r.label, description: t(`smart_notifs.rule_${r.id.replace('_due', '').replace('_log', '')}_desc`) || r.description }));
    // Merge: keep saved enabled state, add new rules from defaults
    return DEFAULT_RULES.map(def => {
      def.label = t(`smart_notifs.rule_${def.id.replace('_due', '').replace('_log', '')}`) || def.label;
      def.description = t(`smart_notifs.rule_${def.id.replace('_due', '').replace('_log', '')}_desc`) || def.description;
      const s = saved.find(r => r.id === def.id);
      return s ? { ...def, enabled: s.enabled } : def;
    });
  } catch { return DEFAULT_RULES; }
};
const saveRules = (r: NotifRule[]) => saveSetting('smartNotifRules', r);

const timeAgo = (dateStr: string, t: any): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return t('smart_notifs.time_just_now');
  if (mins < 60) return t('smart_notifs.time_mins', { m: mins });
  if (hours < 24) return t('smart_notifs.time_hours', { h: hours });
  if (days < 7) return t('smart_notifs.time_days', { d: days });
  const d = new Date(dateStr);
  const months = t('smart_notifs.months', { returnObjects: true }) as string[];
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// ─── Rule Engine ─────────────────────────────────────────────────────────────

const runRuleEngine = (
  vehicles: Vehicle[],
  logs: ServiceLog[],
  rules: NotifRule[],
  existingNotifs: SmartNotif[],
  t: any
): SmartNotif[] => {
  const newNotifs: SmartNotif[] = [];
  const now = new Date();

  const ruleEnabled = (id: string) => rules.find(r => r.id === id)?.enabled ?? false;

  // Helper: last log of type for vehicle
  const lastLog = (vehicleId: string, type: string): ServiceLog | null => {
    return logs
      .filter(l => l.vehicleId === vehicleId && l.type === type)
      .sort((a, b) => b.mileage - a.mileage)[0] || null;
  };

  // Helper: avoid duplicate rule+vehicle combos in recent 7 days
  const alreadyNotified = (ruleId: string, vehicleId?: string): boolean => {
    const cutoff = Date.now() - 7 * 86400000;
    return existingNotifs.some(n =>
      n.ruleId === ruleId &&
      (!vehicleId || n.vehicleId === vehicleId) &&
      new Date(n.createdAt).getTime() > cutoff
    );
  };

  const push = (n: Omit<SmartNotif, 'id' | 'createdAt' | 'read' | 'dismissed'>) => {
    if (alreadyNotified(n.ruleId, n.vehicleId)) return;
    newNotifs.push({ ...n, id: makeId(), createdAt: now.toISOString(), read: false, dismissed: false });
  };

  vehicles.forEach(v => {
    const vName = `${v.brand} ${v.model}`;

    // ── Oil Change ──
    if (ruleEnabled('oil_due')) {
      const last = lastLog(v.id, 'Yağ Değişimi');
      const kmSince = last ? v.mileage - last.mileage : v.mileage;
      if (kmSince >= 12000) {
        push({
          type: 'critical', category: 'maintenance', ruleId: 'oil_due', vehicleId: v.id, vehicleName: vName,
          title: t('smart_notifs.msg_oil_crit_title'),
          message: t('smart_notifs.msg_oil_crit_body', { vehicle: vName, km: kmSince.toLocaleString() }),
          actionRoute: '/add-record', actionLabel: t('smart_notifs.msg_add_record')
        });
      } else if (kmSince >= 9000) {
        push({
          type: 'warning', category: 'maintenance', ruleId: 'oil_due', vehicleId: v.id, vehicleName: vName,
          title: t('smart_notifs.msg_oil_warn_title'),
          message: t('smart_notifs.msg_oil_warn_body', { vehicle: vName, km: kmSince.toLocaleString(), rem: (10000 - kmSince).toLocaleString() }),
          actionRoute: '/add-record', actionLabel: t('smart_notifs.msg_schedule')
        });
      }
    }

    // ── Periodic Service ──
    if (ruleEnabled('service_due')) {
      const last = lastLog(v.id, 'Periyodik Bakım');
      const kmSince = last ? v.mileage - last.mileage : v.mileage;
      if (kmSince >= 17000) {
        push({
          type: 'critical', category: 'maintenance', ruleId: 'service_due', vehicleId: v.id, vehicleName: vName,
          title: t('smart_notifs.msg_serv_crit_title'),
          message: t('smart_notifs.msg_serv_crit_body', { vehicle: vName, km: kmSince.toLocaleString() }),
          actionRoute: '/add-record', actionLabel: t('smart_notifs.msg_add_serv')
        });
      } else if (kmSince >= 13000) {
        push({
          type: 'warning', category: 'maintenance', ruleId: 'service_due', vehicleId: v.id, vehicleName: vName,
          title: t('smart_notifs.msg_serv_warn_title'),
          message: t('smart_notifs.msg_serv_warn_body', { vehicle: vName, km: kmSince.toLocaleString() }),
          actionRoute: '/add-record', actionLabel: t('smart_notifs.msg_plan')
        });
      }
    }

    // ── Tire Rotation ──
    if (ruleEnabled('tire_due')) {
      const last = lastLog(v.id, 'Lastik Rotasyonu');
      const kmSince = last ? v.mileage - last.mileage : v.mileage;
      if (kmSince >= 10000) {
        push({
          type: 'reminder', category: 'maintenance', ruleId: 'tire_due', vehicleId: v.id, vehicleName: vName,
          title: t('smart_notifs.msg_tire_title'),
          message: t('smart_notifs.msg_tire_body', { vehicle: vName, km: kmSince.toLocaleString() }),
          actionRoute: '/add-record', actionLabel: t('smart_notifs.msg_add')
        });
      }
    }

    // ── Brake Service ──
    if (ruleEnabled('brake_due')) {
      const last = lastLog(v.id, 'Fren Servisi');
      const kmSince = last ? v.mileage - last.mileage : v.mileage;
      if (kmSince >= 30000) {
        push({
          type: 'warning', category: 'maintenance', ruleId: 'brake_due', vehicleId: v.id, vehicleName: vName,
          title: t('smart_notifs.msg_brake_title'),
          message: t('smart_notifs.msg_brake_body', { vehicle: vName, km: kmSince.toLocaleString() }),
          actionRoute: '/add-record', actionLabel: t('smart_notifs.msg_add')
        });
      }
    }

    // ── Battery ──
    if (ruleEnabled('battery_due')) {
      const last = lastLog(v.id, 'Akü Değişimi');
      const kmSince = last ? v.mileage - last.mileage : v.mileage;
      if (kmSince >= 60000) {
        push({
          type: 'warning', category: 'maintenance', ruleId: 'battery_due', vehicleId: v.id, vehicleName: vName,
          title: t('smart_notifs.msg_batt_title'),
          message: t('smart_notifs.msg_batt_body', { vehicle: vName, km: kmSince.toLocaleString() }),
          actionRoute: '/add-record', actionLabel: t('smart_notifs.msg_save')
        });
      }
    }

    // ── Low Health Score ──
    if (ruleEnabled('low_health') && v.healthScore < 50) {
      push({
        type: v.healthScore < 30 ? 'critical' : 'warning', category: 'system', ruleId: 'low_health',
        vehicleId: v.id, vehicleName: vName,
        title: t('smart_notifs.msg_health_title', { score: v.healthScore }),
        message: t('smart_notifs.msg_health_body', { vehicle: vName }),
        actionRoute: `/dashboard/${v.id}`, actionLabel: t('smart_notifs.msg_details')
      });
    }

    // ── No Fuel Log ──
    if (ruleEnabled('no_fuel_log')) {
      const fuelLogs = logs.filter(l => l.vehicleId === v.id && l.type === 'Yakıt Alımı');
      if (fuelLogs.length > 0) {
        const lastFuel = fuelLogs.sort((a, b) => b.date.localeCompare(a.date))[0];
        const daysSince = Math.floor((Date.now() - new Date(lastFuel.date + 'T00:00:00').getTime()) / 86400000);
        if (daysSince >= 30) {
          push({
            type: 'info', category: 'fuel', ruleId: 'no_fuel_log', vehicleId: v.id, vehicleName: vName,
            title: t('smart_notifs.msg_fuel_title'),
            message: t('smart_notifs.msg_fuel_body', { vehicle: vName, days: daysSince }),
            actionRoute: '/add-record', actionLabel: t('smart_notifs.msg_add')
          });
        }
      }
    }

    // ── High Monthly Cost ──
    if (ruleEnabled('high_cost')) {
      const thisMonth = now.toISOString().slice(0, 7);
      const monthTotal = logs
        .filter(l => l.vehicleId === v.id && l.date.startsWith(thisMonth))
        .reduce((s, l) => s + l.cost, 0);
      if (monthTotal >= 5000) {
        push({
          type: 'info', category: 'budget', ruleId: 'high_cost', vehicleId: v.id, vehicleName: vName,
          title: t('smart_notifs.msg_budget_title'),
          message: t('smart_notifs.msg_budget_body', { vehicle: vName, total: monthTotal.toLocaleString() }),
          actionRoute: '/budget-goals', actionLabel: t('smart_notifs.msg_budget_goals')
        });
      }
    }

    // ── Achievement: 100k km ──
    if (ruleEnabled('achievement') && v.mileage >= 100000 && v.mileage < 101000) {
      push({
        type: 'success', category: 'achievement', ruleId: 'achievement', vehicleId: v.id, vehicleName: vName,
        title: t('smart_notifs.msg_ach_title'),
        message: t('smart_notifs.msg_ach_body', { vehicle: vName }),
        actionRoute: `/dashboard/${v.id}`, actionLabel: t('smart_notifs.msg_view_car')
      });
    }
  });

  // ── System: welcome ──
  if (ruleEnabled('achievement') && existingNotifs.length === 0) {
    push({
      type: 'success', category: 'system', ruleId: 'achievement',
      title: t('smart_notifs.msg_welcome_title'),
      message: t('smart_notifs.msg_welcome_body'),
      actionRoute: '/', actionLabel: t('smart_notifs.msg_go_garage')
    });
  }

  return newNotifs;
};

// ─── Sub Components ──────────────────────────────────────────────────────────

const NotifCard: React.FC<{
  notif: SmartNotif;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onAction: (route: string) => void;
  t: any;
}> = ({ notif, onRead, onDismiss, onAction, t }) => {
  const cfg = NOTIF_CONFIG[notif.type];
  const CfgIcon = cfg.icon;
  const CatIcon = CAT_ICONS[notif.category];

  return (
    <div
      className={`relative rounded-2xl border p-4 transition-all duration-300 ${notif.read ? 'bg-slate-800/20 border-slate-700/20 opacity-70' : `${cfg.bg} ${cfg.border}`
        }`}
      onClick={() => !notif.read && onRead(notif.id)}
    >
      {/* Unread dot */}
      {!notif.read && (
        <div className={`absolute top-3.5 right-3.5 w-2 h-2 rounded-full ${cfg.dotColor}`} />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
          <CfgIcon size={18} className={cfg.iconColor} />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          {/* Category tag + time */}
          <div className="flex items-center gap-2 mb-1">
            <CatIcon size={10} className="text-slate-500" />
            <span className="text-slate-500 text-[10px] uppercase tracking-wide font-semibold">
              {notif.category === 'maintenance' ? t('smart_notifs.cat_maint') :
                notif.category === 'fuel' ? t('smart_notifs.cat_fuel') :
                  notif.category === 'insurance' ? t('smart_notifs.cat_ins') :
                    notif.category === 'budget' ? t('smart_notifs.cat_budget') :
                      notif.category === 'achievement' ? t('smart_notifs.cat_ach') : t('smart_notifs.cat_sys')}
            </span>
            {notif.vehicleName && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-slate-500 text-[10px] truncate">{notif.vehicleName}</span>
              </>
            )}
            <span className="text-slate-600 text-[10px] ml-auto">{timeAgo(notif.createdAt, t)}</span>
          </div>

          <p className={`text-sm font-bold mb-0.5 ${notif.read ? 'text-slate-400' : 'text-white'}`}>
            {notif.title}
          </p>
          <p className="text-slate-400 text-xs leading-relaxed">{notif.message}</p>

          {/* Action button */}
          {notif.actionRoute && notif.actionLabel && (
            <button
              onClick={e => { e.stopPropagation(); onAction(notif.actionRoute!); }}
              className={`mt-2.5 flex items-center gap-1.5 text-xs font-semibold ${cfg.color} hover:opacity-80 transition-opacity`}
            >
              {notif.actionLabel}
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Dismiss button */}
      <button
        onClick={e => { e.stopPropagation(); onDismiss(notif.id); }}
        className="absolute top-3 right-8 w-6 h-6 rounded-full bg-slate-700/60 flex items-center justify-center hover:bg-slate-600 transition-all"
      >
        <X size={10} className="text-slate-400" />
      </button>
    </div>
  );
};

// Settings panel
const RulesPanel: React.FC<{
  rules: NotifRule[];
  onToggle: (id: string) => void;
  onClose: () => void;
  t: any;
}> = ({ rules, onToggle, onClose, t }) => {
  const grouped = useMemo(() => {
    const g: Record<NotifCategory, NotifRule[]> = { maintenance: [], fuel: [], insurance: [], budget: [], system: [], achievement: [] };
    rules.forEach(r => g[r.category].push(r));
    return g;
  }, [rules]);

  const catLabels: Record<NotifCategory, string> = {
    maintenance: t('smart_notifs.catl_maint'), fuel: t('smart_notifs.catl_fuel'), insurance: t('smart_notifs.catl_ins'),
    budget: t('smart_notifs.catl_budget'), system: t('smart_notifs.catl_sys'), achievement: t('smart_notifs.catl_ach'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 rounded-t-3xl border-t border-slate-700 p-5 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">{t('smart_notifs.rules_title')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <X size={15} className="text-slate-400" />
          </button>
        </div>
        {(Object.entries(grouped) as [NotifCategory, NotifRule[]][]).map(([cat, catRules]) => (
          catRules.length > 0 && (
            <div key={cat} className="mb-5">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">{catLabels[cat]}</p>
              <div className="space-y-2">
                {catRules.map(rule => {
                  const RIcon = rule.icon;
                  return (
                    <div key={rule.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${rule.enabled ? 'bg-slate-800/60 border-slate-700/40' : 'bg-slate-800/20 border-slate-700/20 opacity-60'}`}>
                      <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center flex-shrink-0">
                        <RIcon size={14} className="text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold">{rule.label}</p>
                        <p className="text-slate-500 text-[10px] leading-relaxed">{rule.description}</p>
                      </div>
                      <button
                        onClick={() => onToggle(rule.id)}
                        className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${rule.enabled ? 'bg-violet-600' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${rule.enabled ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const SmartNotifications: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [notifs, setNotifs] = useState<SmartNotif[]>([]);
  const [rules, setRules] = useState<NotifRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showRules, setShowRules] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [v, l] = await Promise.all([fetchVehicles(), fetchLogs()]);
      const savedRules = loadRules(t);
      const savedNotifs = loadNotifs().filter(n => !n.dismissed);
      setRules(savedRules);

      // Run engine
      const fresh = runRuleEngine(v, l, savedRules, savedNotifs, t);
      const all = [...fresh, ...savedNotifs].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotifs(all);
      if (fresh.length) saveNotifs(all);
      setLoading(false);
    };
    load();
  }, []);

  const handleRescan = async () => {
    setScanning(true);
    const [v, l] = await Promise.all([fetchVehicles(), fetchLogs()]);
    // Clear 7-day dedupe to force fresh check
    const cleared: SmartNotif[] = [];
    const fresh = runRuleEngine(v, l, rules, cleared, t);
    const all = [...fresh, ...notifs].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setNotifs(all);
    saveNotifs(all);
    setScanning(false);
  };

  const handleRead = useCallback((id: string) => {
    setNotifs(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotifs(updated);
      return updated;
    });
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setNotifs(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveNotifs(updated);
      return updated;
    });
  }, []);

  const handleMarkAllRead = () => {
    setNotifs(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifs(updated);
      return updated;
    });
  };

  const handleClearAll = () => {
    // confirmed by clear-all button press
    setNotifs([]);
    saveNotifs([]);
  };

  const handleToggleRule = (id: string) => {
    setRules(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
      saveRules(updated);
      return updated;
    });
  };

  const handlePushPermission = async () => {
    const result = await requestPushPermission();

    if (result.granted) {
      setPushEnabled(true);
      toast.success(t('smart_notifs.push_success'), { duration: 5000 });
    } else {
      setPushEnabled(false);
      if (result.error) toast.warning(result.error, { duration: 5000 });
    }
  };

  // Push izni durumunu kontrol et (sayfa açılışında)
  React.useEffect(() => {
    const status = getPushPermissionStatus();
    setPushEnabled(status === 'granted');
  }, []);

  // Filter
  const filtered = useMemo(() => {
    return notifs.filter(n => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !n.read;
      if (['critical', 'warning', 'info', 'success', 'reminder'].includes(filter)) return n.type === filter;
      return n.category === filter;
    });
  }, [notifs, filter]);

  const unreadCount = notifs.filter(n => !n.read).length;
  const criticalCount = notifs.filter(n => n.type === 'critical' && !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center">
            <Bell className="text-violet-400 animate-pulse" size={24} />
          </div>
          <p className="text-slate-400 text-sm">{t('smart_notifs.scanning')}</p>
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
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{t('smart_notifs.title')}</h1>
              {unreadCount > 0 && (
                <span className="bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            <p className="text-slate-500 text-xs">{t('smart_notifs.subtitle')}</p>
          </div>
          <button onClick={() => setShowRules(true)} className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
            <Settings size={16} className="text-slate-400" />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {([
            { key: 'all', label: t('smart_notifs.filter_all') },
            { key: 'unread', label: `🔵 ${t('smart_notifs.filter_unread')}` },
            { key: 'critical', label: `🔴 ${t('smart_notifs.filter_critical')}` },
            { key: 'warning', label: `🟡 ${t('smart_notifs.filter_warning')}` },
            { key: 'reminder', label: `🟣 ${t('smart_notifs.filter_reminder')}` },
            { key: 'success', label: `🟢 ${t('smart_notifs.filter_success')}` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === key
                ? 'bg-slate-200 text-slate-900'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Critical alert banner */}
        {criticalCount > 0 && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-red-300 font-bold text-sm">{t('smart_notifs.crit_alert_title', { count: criticalCount })}</p>
              <p className="text-red-400/70 text-xs">{t('smart_notifs.crit_alert_desc')}</p>
            </div>
            <button onClick={() => setFilter('critical')} className="text-xs text-red-300 font-semibold">{t('smart_notifs.crit_alert_action')}</button>
          </div>
        )}

        {/* Push notification toggle */}
        <div className="space-y-2">
          <button
            onClick={handlePushPermission}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${pushEnabled
              ? 'bg-violet-500/10 border-violet-500/20'
              : 'bg-slate-800/40 border-slate-700/30'
              }`}
          >
            <div className="flex items-center gap-3">
              {pushEnabled ? <BellRing size={16} className="text-violet-400" /> : <BellOff size={16} className="text-slate-500" />}
              <div className="text-left">
                <p className={`text-sm font-medium ${pushEnabled ? 'text-white' : 'text-slate-400'}`}>
                  {pushEnabled ? t('smart_notifs.push_active') : t('smart_notifs.push_enable')}
                </p>
                <p className="text-slate-500 text-xs">{t('smart_notifs.push_desc')}</p>
              </div>
            </div>
            <div className={`w-10 h-5 rounded-full transition-all relative ${pushEnabled ? 'bg-violet-600' : 'bg-slate-700'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${pushEnabled ? 'left-5' : 'left-0.5'}`} />
            </div>
          </button>

          {/* Diagnostic Button (Hidden unless error or manual check) */}
          <button
            onClick={async () => {
              toast.info("Bildirim sistemi kontrol ediliyor...", { id: 'diag' });
              try {
                const { initNotifications } = await import('../services/notificationService');
                await initNotifications();
                toast.success("Bağlantı başarılı! Lütfen Admin panelinden tekrar deneyin.", { id: 'diag' });
              } catch (err: any) {
                toast.error(`Hata: ${err.message || 'Bilinmiyor'}`, { id: 'diag' });
              }
            }}
            className="w-full py-2 text-[10px] uppercase font-black text-slate-600 hover:text-slate-400 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={10} />
            Bağlantıyı Yenile ve Sorun Gider
          </button>
        </div>

        {/* Action row */}
        {notifs.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleRescan}
              disabled={scanning}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/30 text-slate-400 text-xs hover:bg-slate-700/60 transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
              {scanning ? t('smart_notifs.btn_scanning') : t('smart_notifs.btn_scan')}
            </button>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/30 text-slate-400 text-xs hover:bg-slate-700/60 transition-all">
                <CheckCheck size={12} />
                {t('smart_notifs.btn_read_all')}
              </button>
            )}
            <button onClick={handleClearAll} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/30 text-slate-400 text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all ml-auto">
              <Trash2 size={12} />
              {t('smart_notifs.btn_clear')}
            </button>
          </div>
        )}

        {/* Notifications */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(n => (
              <NotifCard
                key={n.id}
                notif={n}
                onRead={handleRead}
                onDismiss={handleDismiss}
                onAction={route => navigate(route)}
                t={t}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center mb-4">
              <Bell size={32} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold mb-1">
              {filter === 'all' ? t('smart_notifs.empty_title_all') : t('smart_notifs.empty_title_filter')}
            </p>
            <p className="text-slate-600 text-xs max-w-xs">
              {filter === 'all' ? t('smart_notifs.empty_desc_all') : t('smart_notifs.empty_desc_filter')}
            </p>
            <button onClick={handleRescan} className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold">
              <RefreshCw size={14} />
              {t('smart_notifs.empty_btn')}
            </button>
          </div>
        )}
      </div>

      {showRules && (
        <RulesPanel rules={rules} onToggle={handleToggleRule} onClose={() => setShowRules(false)} t={t} />
      )}
    </div>
  );
};
