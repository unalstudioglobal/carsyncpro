import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Users, Plus, Copy, Check, Crown, Shield,
  Eye, Trash2, UserPlus, X, Car, Key, AlertTriangle,
  CheckCircle2, Clock, RefreshCw, Info, LogOut, Gauge,
  Wrench, Fuel, Share2, QrCode, Mail
} from 'lucide-react';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, serverTimestamp, query, where, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { addVehicle, fetchVehicles, updateVehicle, fetchLogs } from '../services/firestoreService';
import { getSetting, saveSetting, removeSetting } from '../services/settingsService';
import { Vehicle, ServiceLog } from '../types';
import { toast } from '../services/toast';

// ─── Types ───────────────────────────────────────────────────────────────────

type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';
type InviteStatus = 'pending' | 'accepted' | 'declined';

interface GarageMember {
  uid: string;
  email: string;
  name: string;
  role: MemberRole;
  joinedAt: string;
  avatar?: string;
}

interface GarageInvite {
  id: string;
  email: string;
  role: MemberRole;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
  inviteCode: string;
}

interface SharedGarage {
  id: string;
  name: string;
  ownerId: string;
  members: GarageMember[];
  invites: GarageInvite[];
  sharedVehicleIds: string[];
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

// ROLE_CONFIG keys will be used to fetch label/desc dynamically using t()

const LS_KEY = 'carsync_family_garage';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

const loadGarage = (): SharedGarage | null => {
  return getSetting<SharedGarage | null>('familyGroup', null);
};

const saveGarage = (g: SharedGarage) =>
  saveSetting('familyGroup', g);

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const getAvatarColor = (uid: string) => {
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
  const idx = uid.charCodeAt(0) % colors.length;
  return colors[idx];
};

const timeAgo = (dateStr: string, t: any) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return t('garage.t_today');
  if (days === 1) return t('garage.t_yest');
  if (days < 30) return t('garage.t_days', { d: days });
  return t('garage.t_mo', { m: Math.floor(days / 30) });
};

// ─── Sub Components ──────────────────────────────────────────────────────────

const MemberAvatar: React.FC<{ member: GarageMember; size?: 'sm' | 'md' | 'lg' }> = ({ member, size = 'md' }) => {
  const RoleCfg = {
    color: member.role === 'owner' ? 'text-amber-400' : member.role === 'admin' ? 'text-indigo-400' : member.role === 'member' ? 'text-blue-400' : 'text-slate-400',
    bg: member.role === 'owner' ? 'bg-amber-500/10' : member.role === 'admin' ? 'bg-indigo-500/10' : member.role === 'member' ? 'bg-blue-500/10' : 'bg-slate-500/10',
    border: member.role === 'owner' ? 'border-amber-500/20' : member.role === 'admin' ? 'border-indigo-500/20' : member.role === 'member' ? 'border-blue-500/20' : 'border-slate-500/20',
    icon: member.role === 'owner' ? Crown : member.role === 'admin' ? Shield : member.role === 'member' ? Users : Eye
  };
  const sizeClass = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }[size];

  const RoleIcon = RoleCfg.icon;

  return (
    <div className="relative">
      <div className={`${sizeClass} ${getAvatarColor(member.uid)})} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0`}>
        {getInitials(member.name)}
      </div>
      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${RoleCfg.bg} border ${RoleCfg.border} flex items-center justify-center`}>
        <RoleIcon size={8} className={RoleCfg.color} />
      </div>
    </div>
  );
};

const MemberCard: React.FC<{
  member: GarageMember;
  isCurrentUser: boolean;
  isOwner: boolean;
  onRoleChange: (uid: string, role: MemberRole) => void;
  onRemove: (uid: string) => void;
  t: any;
}> = ({ member, isCurrentUser, isOwner, onRoleChange, onRemove, t }) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const roleCfg = {
    color: member.role === 'owner' ? 'text-amber-400' : member.role === 'admin' ? 'text-indigo-400' : member.role === 'member' ? 'text-blue-400' : 'text-slate-400',
    bg: member.role === 'owner' ? 'bg-amber-500/10' : member.role === 'admin' ? 'bg-indigo-500/10' : member.role === 'member' ? 'bg-blue-500/10' : 'bg-slate-500/10',
    border: member.role === 'owner' ? 'border-amber-500/20' : member.role === 'admin' ? 'border-indigo-500/20' : member.role === 'member' ? 'border-blue-500/20' : 'border-slate-500/20',
    icon: member.role === 'owner' ? Crown : member.role === 'admin' ? Shield : member.role === 'member' ? Users : Eye
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-800/60 last:border-0">
      <MemberAvatar member={member} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white text-sm font-semibold truncate">{member.name}</p>
          {isCurrentUser && <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-md">{t('garage.you')}</span>}
        </div>
        <p className="text-slate-500 text-xs truncate">{member.email}</p>
        <p className="text-slate-600 text-[10px] mt-0.5">{t('garage.joined')} {timeAgo(member.joinedAt, t)}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Role badge */}
        <div className="relative">
          <button
            onClick={() => isOwner && !isCurrentUser && setShowRoleMenu(!showRoleMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold ${roleCfg.bg} ${roleCfg.border} border ${roleCfg.color} ${isOwner && !isCurrentUser ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
          >
            <roleCfg.icon size={11} />
            {t('garage.role_' + member.role)}
          </button>
          {showRoleMenu && (
            <div className="absolute right-0 top-8 z-10 bg-slate-900 border border-slate-700 rounded-xl p-1 w-40 shadow-2xl">
              {(['admin', 'member', 'viewer'] as MemberRole[])
                .map((key) => {
                  const Icon = key === 'admin' ? Shield : key === 'member' ? Users : Eye;
                  const color = key === 'admin' ? 'text-indigo-400' : key === 'member' ? 'text-blue-400' : 'text-slate-400';
                  return (
                    <button
                      key={key}
                      onClick={() => { onRoleChange(member.uid, key); setShowRoleMenu(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:bg-slate-800 ${member.role === key ? color : 'text-slate-400'}`}
                    >
                      <Icon size={12} />
                      {t('garage.role_' + key)}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
        {isOwner && !isCurrentUser && (
          <button onClick={() => onRemove(member.uid)} className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-red-500/20 transition-all">
            <Trash2 size={12} className="text-slate-500 hover:text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
};

const VehicleShareCard: React.FC<{
  vehicle: Vehicle;
  logs: ServiceLog[];
  isShared: boolean;
  onToggle: () => void;
  t: any;
}> = ({ vehicle, logs, isShared, onToggle, t }) => {
  const vehicleLogs = logs.filter(l => l.vehicleId === vehicle.id);
  const totalCost = vehicleLogs.reduce((s, l) => s + l.cost, 0);

  return (
    <div className={`rounded-2xl border p-4 transition-all ${isShared ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-slate-800/40 border-slate-700/30'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isShared ? 'bg-indigo-500/20' : 'bg-slate-700/60'}`}>
          <Car size={18} className={isShared ? 'text-indigo-400' : 'text-slate-500'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isShared ? 'text-white' : 'text-slate-300'}`}>
            {vehicle.brand} {vehicle.model}
          </p>
          <p className="text-slate-500 text-xs">{vehicle.plate} · {vehicle.mileage.toLocaleString()} km</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isShared && (
            <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">{t('garage.shared')}</span>
          )}
          <button
            onClick={onToggle}
            className={`w-12 h-6 rounded-full transition-all relative ${isShared ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${isShared ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Invite Modal
const InviteModal: React.FC<{
  inviteCode: string;
  onInviteByEmail: (email: string, role: MemberRole) => void;
  onClose: () => void;
  t: any;
}> = ({ inviteCode, onInviteByEmail, onClose, t }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('member');
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const inviteLink = `${window.location.origin}/join-garage?code=${inviteCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000);
  };
  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{t('garage.inv_title')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <X size={15} className="text-slate-400" />
          </button>
        </div>

        {/* Invite code */}
        <div className="bg-slate-800/60 rounded-2xl p-4 text-center">
          <p className="text-slate-500 text-xs mb-2">{t('garage.inv_code')}</p>
          <p className="text-3xl font-mono font-black text-white tracking-widest mb-3">{inviteCode}</p>
          <div className="flex gap-2">
            <button onClick={copyCode} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${codeCopied ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {codeCopied ? <Check size={12} /> : <Copy size={12} />}
              {codeCopied ? t('garage.copied') : t('garage.copy_c')}
            </button>
            <button onClick={copyLink} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${linkCopied ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {linkCopied ? <Check size={12} /> : <Share2 size={12} />}
              {linkCopied ? t('garage.copied') : t('garage.share_l')}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-slate-500 text-xs">{t('garage.or_email')}</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Email invite */}
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="ornek@email.com"
            className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-sm border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
          />
          <div className="grid grid-cols-2 gap-2">
            {(['member', 'viewer', 'admin'] as MemberRole[]).map(r => {
              const cfg = {
                color: r === 'owner' ? 'text-amber-400' : r === 'admin' ? 'text-indigo-400' : r === 'member' ? 'text-blue-400' : 'text-slate-400',
                bg: r === 'owner' ? 'bg-amber-500/10' : r === 'admin' ? 'bg-indigo-500/10' : r === 'member' ? 'bg-blue-500/10' : 'bg-slate-500/10',
                border: r === 'owner' ? 'border-amber-500/20' : r === 'admin' ? 'border-indigo-500/20' : r === 'member' ? 'border-blue-500/20' : 'border-slate-500/20',
                icon: r === 'owner' ? Crown : r === 'admin' ? Shield : r === 'member' ? Users : Eye
              };
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${role === r ? `${cfg.bg} ${cfg.border} border ${cfg.color}` : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                >
                  <cfg.icon size={12} />
                  <div className="text-left">
                    <p className="font-semibold">{t('garage.role_' + r)}</p>
                    <p className="text-[10px] opacity-70">{t('garage.role_' + r + '_desc')}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            disabled={!email || !email.includes('@')}
            onClick={() => { onInviteByEmail(email, role); setEmail(''); }}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-30 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
          >
            <Mail size={15} />
            {t('garage.send_inv')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Garage Modal
const CreateGarageModal: React.FC<{
  onCreate: (name: string) => void;
  onClose: () => void;
  t: any;
}> = ({ onCreate, onClose, t }) => {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{t('garage.create_title')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <X size={15} className="text-slate-400" />
          </button>
        </div>
        <p className="text-slate-500 text-sm">{t('garage.create_desc')}</p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('garage.create_ph')}
          className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-sm border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          disabled={name.trim().length < 2}
          onClick={() => { onCreate(name.trim()); onClose(); }}
          className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-30 hover:bg-indigo-500 transition-all"
        >
          {t('garage.create_btn')}
        </button>
      </div>
    </div>
  );
};

// Join Garage Modal
const JoinGarageModal: React.FC<{
  onJoin: (code: string) => void;
  onClose: () => void;
  t: any;
}> = ({ onJoin, onClose, t }) => {
  const [code, setCode] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{t('garage.join_title')}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <X size={15} className="text-slate-400" />
          </button>
        </div>
        <p className="text-slate-500 text-sm">{t('garage.join_desc')}</p>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="ABC123"
          className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-xl font-mono font-bold tracking-widest text-center border border-slate-700 focus:outline-none focus:border-indigo-500 uppercase"
          maxLength={6}
        />
        <button
          disabled={code.length < 6}
          onClick={() => { onJoin(code); onClose(); }}
          className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm disabled:opacity-30 hover:bg-emerald-500 transition-all"
        >
          {t('garage.join_btn')}
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const FamilyGarage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [garage, setGarage] = useState<SharedGarage | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'vehicles' | 'invites'>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Simulate current user
  const currentUser = useMemo(() => ({
    uid: auth.currentUser?.uid || 'demo-user',
    email: auth.currentUser?.email || 'demo@carsync.app',
    name: auth.currentUser?.displayName || 'Demo Kullanıcı',
  }), []);

  useEffect(() => {
    const load = async () => {
      const [v, l] = await Promise.all([fetchVehicles(), fetchLogs()]);
      setVehicles(v);
      setLogs(l);
      setGarage(loadGarage());
      setLoading(false);
    };
    load();
  }, []);

  const isOwner = garage?.ownerId === currentUser.uid;
  const currentMember = garage?.members.find(m => m.uid === currentUser.uid);

  const handleCreate = (name: string) => {
    const newGarage: SharedGarage = {
      id: Date.now().toString(),
      name,
      ownerId: currentUser.uid,
      members: [{
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.name,
        role: 'owner',
        joinedAt: new Date().toISOString(),
      }],
      invites: [],
      sharedVehicleIds: [],
      createdAt: new Date().toISOString(),
    };
    setGarage(newGarage);
    saveGarage(newGarage);
  };

  const handleJoin = (code: string) => {
    // In production: look up garage by code via Firestore
    // For demo: show success message
    toast.info(t('garage.join_req_sent', { c: code }));
  };

  const handleInviteByEmail = (email: string, role: MemberRole) => {
    if (!garage) return;
    const invite: GarageInvite = {
      id: Date.now().toString(),
      email, role,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      inviteCode: generateCode(),
    };
    const updated = { ...garage, invites: [...garage.invites, invite] };
    setGarage(updated); saveGarage(updated);
    // In production: send email via Firebase Cloud Functions
    toast.success(t('garage.email_inv_sent', { e: email }));
  };

  const handleRoleChange = (uid: string, role: MemberRole) => {
    if (!garage) return;
    const updated = { ...garage, members: garage.members.map(m => m.uid === uid ? { ...m, role } : m) };
    setGarage(updated); saveGarage(updated);
  };

  const handleRemoveMember = (uid: string) => {
    if (!garage) return;
    const updated = { ...garage, members: garage.members.filter(m => m.uid !== uid) };
    setGarage(updated); saveGarage(updated);
  };

  const handleToggleVehicle = (vehicleId: string) => {
    if (!garage) return;
    const shared = garage.sharedVehicleIds.includes(vehicleId)
      ? garage.sharedVehicleIds.filter(id => id !== vehicleId)
      : [...garage.sharedVehicleIds, vehicleId];
    const updated = { ...garage, sharedVehicleIds: shared };
    setGarage(updated); saveGarage(updated);
  };

  const handleLeave = () => {
    if (!garage) return;
    if (!window.confirm(t('garage.leave_confirm'))) return;
    if (isOwner) {
      removeSetting('familyGroup');
      setGarage(null);
    } else {
      const updated = { ...garage, members: garage.members.filter(m => m.uid !== currentUser.uid) };
      setGarage(updated); saveGarage(updated);
    }
  };

  const handleCancelInvite = (inviteId: string) => {
    if (!garage) return;
    const updated = { ...garage, invites: garage.invites.filter(i => i.id !== inviteId) };
    setGarage(updated); saveGarage(updated);
  };

  const inviteCode = garage?.invites[0]?.inviteCode || generateCode();
  const pendingInvites = garage?.invites.filter(i => i.status === 'pending') || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <Users className="text-indigo-400 animate-pulse" size={24} />
          </div>
          <p className="text-slate-400 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // ── No Garage State ──────────────────────────────────────────────────────

  if (!garage) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 px-4 pt-12 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
              <ChevronLeft size={20} className="text-slate-300" />
            </button>
            <h1 className="text-lg font-bold text-white">{t('garage.empty_title')}</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 text-center px-6 pb-24">
          <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
            <Users size={40} className="text-indigo-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">{t('garage.empty_subtitle')}</h2>
          <p className="text-slate-500 text-sm mb-8 max-w-xs leading-relaxed">
            {t('garage.empty_desc')}
          </p>
          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus size={16} />
              {t('garage.btn_new')}
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-all border border-slate-700"
            >
              <Key size={16} />
              {t('garage.btn_join')}
            </button>
          </div>
          {/* Feature highlights */}
          <div className="mt-8 w-full max-w-xs space-y-3 text-left">
            {[
              { icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10', text: t('garage.feat_1') },
              { icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10', text: t('garage.feat_2') },
              { icon: Key, color: 'text-emerald-400', bg: 'bg-emerald-500/10', text: t('garage.feat_3') },
            ].map(({ icon: Icon, color, bg, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={15} className={color} />
                </div>
                <p className="text-slate-500 text-xs">{text}</p>
              </div>
            ))}
          </div>
        </div>
        {showCreateModal && <CreateGarageModal onCreate={handleCreate} onClose={() => setShowCreateModal(false)} t={t} />}
        {showJoinModal && <JoinGarageModal onJoin={handleJoin} onClose={() => setShowJoinModal(false)} t={t} />}
      </div>
    );
  }

  // ── Garage Dashboard ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50 px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
            <ChevronLeft size={20} className="text-slate-300" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{garage.name}</h1>
            <p className="text-slate-500 text-xs">{t('garage.counts', { m: garage.members.length, v: garage.sharedVehicleIds.length })}</p>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20"
            >
              <UserPlus size={16} className="text-white" />
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex bg-slate-800/40 rounded-2xl p-1 border border-slate-700/30">
          {([
            { key: 'members', label: t('garage.tab_m', { c: garage.members.length }) },
            { key: 'vehicles', label: t('garage.tab_v', { c: garage.sharedVehicleIds.length }) },
            { key: 'invites', label: t('garage.tab_i', { c: pendingInvites.length }) },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === key ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Members tab */}
        {activeTab === 'members' && (
          <>
            {/* Member stack preview */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex -space-x-2">
                {garage.members.slice(0, 5).map(m => (
                  <div key={m.uid} className={`w-8 h-8 rounded-full ${getAvatarColor(m.uid)} border-2 border-slate-950 flex items-center justify-center text-white text-xs font-bold`}>
                    {getInitials(m.name)}
                  </div>
                ))}
              </div>
              {garage.members.length > 5 && (
                <span className="text-slate-500 text-xs">{t('garage.more_m', { c: garage.members.length - 5 })}</span>
              )}
            </div>

            <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl px-4">
              {garage.members.map(member => (
                <MemberCard
                  key={member.uid}
                  member={member}
                  isCurrentUser={member.uid === currentUser.uid}
                  isOwner={isOwner}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemoveMember}
                  t={t}
                />
              ))}
            </div>

            {/* Invite button */}
            {isOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm font-semibold hover:bg-indigo-600/30 transition-all"
              >
                <UserPlus size={15} />
                {t('garage.btn_inv_new')}
              </button>
            )}

            {/* Leave button */}
            <button
              onClick={handleLeave}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800/40 border border-slate-700/30 text-slate-500 text-sm hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
            >
              <LogOut size={15} />
              {isOwner ? t('garage.btn_close_g') : t('garage.btn_leave')}
            </button>
          </>
        )}

        {/* Vehicles tab */}
        {activeTab === 'vehicles' && (
          <>
            <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <Info size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-300/80 text-xs leading-relaxed">
                {t('garage.info_v')}
              </p>
            </div>
            <div className="space-y-3">
              {vehicles.map(v => (
                <VehicleShareCard
                  key={v.id}
                  vehicle={v}
                  logs={logs}
                  isShared={garage.sharedVehicleIds.includes(v.id)}
                  onToggle={() => handleToggleVehicle(v.id)}
                  t={t}
                />
              ))}
            </div>
            {vehicles.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">{t('garage.no_v')}</p>
              </div>
            )}
          </>
        )}

        {/* Invites tab */}
        {activeTab === 'invites' && (
          <>
            {pendingInvites.length > 0 ? (
              <div className="space-y-3">
                {pendingInvites.map(invite => {
                  const cfg = {
                    color: invite.role === 'owner' ? 'text-amber-400' : invite.role === 'admin' ? 'text-indigo-400' : invite.role === 'member' ? 'text-blue-400' : 'text-slate-400',
                    bg: invite.role === 'owner' ? 'bg-amber-500/10' : invite.role === 'admin' ? 'bg-indigo-500/10' : invite.role === 'member' ? 'bg-blue-500/10' : 'bg-slate-500/10',
                    border: invite.role === 'owner' ? 'border-amber-500/20' : invite.role === 'admin' ? 'border-indigo-500/20' : invite.role === 'member' ? 'border-blue-500/20' : 'border-slate-500/20',
                  };
                  const expiry = new Date(invite.expiresAt);
                  const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
                  return (
                    <div key={invite.id} className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-white text-sm font-semibold">{invite.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border} font-medium`}>
                              {t('garage.role_' + invite.role)}
                            </span>
                            <span className="text-xs text-amber-400 flex items-center gap-1">
                              <Clock size={10} />
                              {daysLeft > 0 ? t('garage.days_left', { d: daysLeft }) : t('garage.expired')}
                            </span>
                          </div>
                        </div>
                        {isOwner && (
                          <button onClick={() => handleCancelInvite(invite.id)} className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center hover:bg-red-500/20 transition-all">
                            <X size={13} className="text-slate-400" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 bg-slate-700/40 rounded-xl px-3 py-2">
                        <span className="text-slate-500 text-xs">{t('garage.code_lbl')}</span>
                        <span className="font-mono font-bold text-white text-sm tracking-widest">{invite.inviteCode}</span>
                        <button onClick={() => navigator.clipboard.writeText(invite.inviteCode)} className="ml-auto">
                          <Copy size={12} className="text-slate-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <Mail size={24} className="text-slate-600" />
                </div>
                <p className="text-slate-500 text-sm">{t('garage.no_inv')}</p>
                {isOwner && (
                  <button onClick={() => setShowInviteModal(true)} className="mt-4 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold">
                    {t('garage.send_inv')}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showInviteModal && (
        <InviteModal
          inviteCode={inviteCode}
          onInviteByEmail={handleInviteByEmail}
          onClose={() => setShowInviteModal(false)}
          t={t}
        />
      )}
    </div>
  );
};
