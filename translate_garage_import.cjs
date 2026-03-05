const fs = require('fs');

// 1. Update Translations
const trPath = 'src/locales/tr/translation.json';
const enPath = 'src/locales/en/translation.json';

const trData = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

trData.garage = {
    // Roles
    "role_owner": "Sahip", "role_owner_desc": "Tam kontrol",
    "role_admin": "Yönetici", "role_admin_desc": "Ekleyebilir, düzenleyebilir",
    "role_member": "Üye", "role_member_desc": "Kayıt ekleyebilir",
    "role_viewer": "İzleyici", "role_viewer_desc": "Sadece görüntüleyebilir",

    // Time
    "t_today": "Bugün", "t_yest": "Dün", "t_days": "{{d}} gün önce", "t_mo": "{{m}} ay önce",

    // Member card
    "you": "Sen", "joined": "Katılım:", "shared": "Paylaşılıyor",

    // Modals
    "inv_title": "Üye Davet Et", "inv_code": "Davet Kodu",
    "copied": "Kopyalandı!", "copy_c": "Kodu Kopyala", "share_l": "Linki Paylaş",
    "or_email": "veya e-posta ile", "send_inv": "Davet Gönder",
    "email_inv_sent": "\"{{e}}\" adresine davet gönderildi.",

    "create_title": "Garaj Oluştur",
    "create_desc": "Aile veya ekibinizle araç verilerini paylaşmak için ortak bir garaj oluşturun.",
    "create_ph": "örn: Aile Garajı, Şirket Araçları", "create_btn": "Garajı Oluştur",

    "join_title": "Garaja Katıl", "join_desc": "Garaj sahibinin sana verdiği 6 haneli kodu gir.",
    "join_btn": "Garaja Katıl",
    "join_req_sent": "\"{{c}}\" davet kodu ile katılma isteği gönderildi.",

    "leave_confirm": "Garajdan ayrılmak istediğine emin misin?",

    // Dashboard
    "empty_title": "Aile Garajı",
    "empty_subtitle": "Ortak Garaj",
    "empty_desc": "Aile veya ekibinizle araç verilerini paylaşın. Herkes kendi rolüne göre erişebilir.",
    "btn_new": "Yeni Garaj Oluştur",
    "btn_join": "Davete Katıl (Kod ile)",
    "feat_1": "Sahip, yönetici, üye, izleyici rol sistemi",
    "feat_2": "Araç bazlı paylaşım — ne paylaşacağını sen seç",
    "feat_3": "6 haneli davet kodu veya e-posta ile davet",

    "counts": "{{m}} üye · {{v}} paylaşılan araç",
    "tab_m": "Üyeler ({{c}})", "tab_v": "Araçlar ({{c}})", "tab_i": "Davetler ({{c}})",
    "more_m": "+{{c}} daha",

    "btn_inv_new": "Yeni Üye Davet Et",
    "btn_close_g": "Garajı Kapat", "btn_leave": "Garajdan Ayrıl",

    "info_v": "Paylaştığın araçlar garaj üyeleri tarafından görüntülenebilir. Rollere göre kayıt ekleyebilirler.",
    "no_v": "Garajda araç bulunamadı.",

    "days_left": "{{d}} gün kaldı", "expired": "Süresi doldu", "code_lbl": "Kod:",
    "no_inv": "Bekleyen davet yok."
};

enData.garage = {
    "role_owner": "Owner", "role_owner_desc": "Full control",
    "role_admin": "Admin", "role_admin_desc": "Can add, edit",
    "role_member": "Member", "role_member_desc": "Can add records",
    "role_viewer": "Viewer", "role_viewer_desc": "Can view only",

    "t_today": "Today", "t_yest": "Yesterday", "t_days": "{{d}} days ago", "t_mo": "{{m}} months ago",

    "you": "You", "joined": "Joined:", "shared": "Shared",

    "inv_title": "Invite Member", "inv_code": "Invite Code",
    "copied": "Copied!", "copy_c": "Copy Code", "share_l": "Share Link",
    "or_email": "or by email", "send_inv": "Send Invite",
    "email_inv_sent": "Invite sent to \"{{e}}\".",

    "create_title": "Create Garage",
    "create_desc": "Create a shared garage to share vehicle data with family or team.",
    "create_ph": "ex: Family Garage, Company Cars", "create_btn": "Create Garage",

    "join_title": "Join Garage", "join_desc": "Enter the 6-digit code provided by the owner.",
    "join_btn": "Join Garage",
    "join_req_sent": "Join request sent with code \"{{c}}\".",

    "leave_confirm": "Are you sure you want to leave the garage?",

    "empty_title": "Family Garage",
    "empty_subtitle": "Shared Garage",
    "empty_desc": "Share vehicle data with family or team. Everyone accesses based on role.",
    "btn_new": "Create New Garage",
    "btn_join": "Join via Invite",
    "feat_1": "Owner, admin, member, viewer roles",
    "feat_2": "Per-vehicle sharing — choose what to share",
    "feat_3": "Invite via 6-digit code or email",

    "counts": "{{m}} members · {{v}} shared vehicles",
    "tab_m": "Members ({{c}})", "tab_v": "Vehicles ({{c}})", "tab_i": "Invites ({{c}})",
    "more_m": "+{{c}} more",

    "btn_inv_new": "Invite New Member",
    "btn_close_g": "Close Garage", "btn_leave": "Leave Garage",

    "info_v": "Vehicles you share can be viewed by members. They can add records based on roles.",
    "no_v": "No vehicles found in the garage.",

    "days_left": "{{d}} days left", "expired": "Expired", "code_lbl": "Code:",
    "no_inv": "No pending invites."
};

trData.importExport = {
    "no_vehicle": "Araç Bulunamadı", "no_vehicle_desc": "Transfer edilecek bir aracınız yok.", "return_garage": "Garaja Dön",
    "back": "Geri", "title": "Geçmişi Aktar",
    "ready": "Aktarıma Hazır",
    "srv_rec": "Servis Kayıtları", "fuel_data": "Yakıt Verisi", "docs": "Belgeler",
    "copy_code": "Kodu Kopyala", "share": "Paylaş", "code_copied": "Kod kopyalandı!",
    "info_txt": "Bu QR kodu tek seferlik kullanım içindir. Transfer tamamlandığında, araç sahipliği ve tüm geçmiş veriler alıcıya devredilecektir.",

    "err_cam_denied": "Kamera izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.",
    "err_cam_notfound": "Kamera bulunamadı. Cihazınızda kamera olduğundan emin olun.",
    "err_cam_fail": "Kamera açılamadı:",
    "err_invalid": "Geçersiz kod formatı. Örnek: TR-ABC-123",
    "success_import": "\"{{c}}\" kodu ile araç geçmişi içe aktarıldı!",

    "import_qr": "QR ile İçe Aktar", "import_qr_desc": "Satıcının QR kodunu kamerayla tarayarak araç bakım geçmişini anında al.",
    "start_cam": "Kamerayı Başlat", "manual_fallback": "Kamera yoksa kodu manuel gir",
    "req_cam": "Kamera izni isteniyor...",
    "scan_qr": "QR Kodu Tara", "scan_hint": "Kodu çerçevenin içine getir", "manual_entry": "Manuel kod gir",
    "cam_failed": "Kamera Açılamadı", "manual_btn": "Manuel Kod Gir",
    "code_scanned": "Kod Tarandı!", "importing": "İçe Aktarılıyor...", "confirm": "Onayla ve İçe Aktar", "scan_again": "Tekrar Tara",
    "manual_title": "Manuel Kod Gir", "switch_cam": "Kameraya geç",
    "manual_hint": "Transfer kodunu satıcıdan alın (TR-ABC-123 formatında)", "processing": "İşleniyor..."
};

enData.importExport = {
    "no_vehicle": "No Vehicle Found", "no_vehicle_desc": "You don't have a vehicle to transfer.", "return_garage": "Return to Garage",
    "back": "Back", "title": "Transfer History",
    "ready": "Ready to Transfer",
    "srv_rec": "Service Records", "fuel_data": "Fuel Data", "docs": "Documents",
    "copy_code": "Copy Code", "share": "Share", "code_copied": "Code copied!",
    "info_txt": "This QR code is for one-time use. Upon completion, vehicle ownership and all history will be transferred.",

    "err_cam_denied": "Camera permission denied. Please allow it in browser settings.",
    "err_cam_notfound": "Camera not found. Make sure your device has a camera.",
    "err_cam_fail": "Could not open camera:",
    "err_invalid": "Invalid code format. Example: TR-ABC-123",
    "success_import": "Vehicle history imported with code \"{{c}}\"!",

    "import_qr": "Import via QR", "import_qr_desc": "Scan the seller's QR code to instantly import vehicle history.",
    "start_cam": "Start Camera", "manual_fallback": "Enter code manually if no camera",
    "req_cam": "Requesting camera permission...",
    "scan_qr": "Scan QR Code", "scan_hint": "Place code inside the frame", "manual_entry": "Enter manual code",
    "cam_failed": "Camera Failed", "manual_btn": "Enter Manual Code",
    "code_scanned": "Code Scanned!", "importing": "Importing...", "confirm": "Confirm & Import", "scan_again": "Scan Again",
    "manual_title": "Enter Manual Code", "switch_cam": "Switch to camera",
    "manual_hint": "Get transfer code from seller (TR-ABC-123 format)", "processing": "Processing..."
};

fs.writeFileSync(trPath, JSON.stringify(trData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

// --- 2. Update FamilyGarage.tsx ---
let fg = fs.readFileSync('pages/FamilyGarage.tsx', 'utf8');
if (!fg.includes('useTranslation')) {
    fg = fg.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}

// Pass t down and fix string replacements
const oldRoleCfg = `const ROLE_CONFIG: Record<MemberRole, {
  label: string; desc: string;
  color: string; bg: string; border: string; icon: React.ElementType
}> = {
  owner: { label: 'Sahip', desc: 'Tam kontrol', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Crown },
  admin: { label: 'Yönetici', desc: 'Ekleyebilir, düzenleyebilir', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: Shield },
  member: { label: 'Üye', desc: 'Kayıt ekleyebilir', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Users },
  viewer: { label: 'İzleyici', desc: 'Sadece görüntüleyebilir', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Eye },
};`;
const newRoleCfg = `// ROLE_CONFIG keys will be used to fetch label/desc dynamically using t()`;
fg = fg.replace(oldRoleCfg, newRoleCfg);

// Pass t to timeAgo
fg = fg.replace("const timeAgo = (dateStr: string) => {", "const timeAgo = (dateStr: string, t: any) => {");
const oldTime = `  if (days === 0) return 'Bugün';
  if (days === 1) return 'Dün';
  if (days < 30) return \`\${days} gün önce\`;
  return \`\${Math.floor(days / 30)} ay önce\`;`;
const newTime = `  if (days === 0) return t('garage.t_today');
  if (days === 1) return t('garage.t_yest');
  if (days < 30) return t('garage.t_days', { d: days });
  return t('garage.t_mo', { m: Math.floor(days / 30) });`;
fg = fg.replace(oldTime, newTime);

fg = fg.replace("onRemove: (uid: string) => void;\n}> = ({ member, isCurrentUser, isOwner, onRoleChange, onRemove }) => {", "onRemove: (uid: string) => void;\n  t: any;\n}> = ({ member, isCurrentUser, isOwner, onRoleChange, onRemove, t }) => {");
// Get color dynamically
const dynRoleCfg = `const roleCfg = {
    color: member.role === 'owner' ? 'text-amber-400' : member.role === 'admin' ? 'text-indigo-400' : member.role === 'member' ? 'text-blue-400' : 'text-slate-400',
    bg: member.role === 'owner' ? 'bg-amber-500/10' : member.role === 'admin' ? 'bg-indigo-500/10' : member.role === 'member' ? 'bg-blue-500/10' : 'bg-slate-500/10',
    border: member.role === 'owner' ? 'border-amber-500/20' : member.role === 'admin' ? 'border-indigo-500/20' : member.role === 'member' ? 'border-blue-500/20' : 'border-slate-500/20',
    icon: member.role === 'owner' ? Crown : member.role === 'admin' ? Shield : member.role === 'member' ? Users : Eye
  };`;

fg = fg.replace("const roleCfg = ROLE_CONFIG[member.role];", dynRoleCfg);

// Update MemberCard ui texts
fg = fg.replace(">Sen</span>", ">{t('garage.you')}</span>");
fg = fg.replace("Katılım: {timeAgo(member.joinedAt)}", "{t('garage.joined')} {timeAgo(member.joinedAt, t)}");
fg = fg.replace("{roleCfg.label}", "{t('garage.role_' + member.role)}");

const oldRoleMenu = `{(Object.entries(ROLE_CONFIG) as [MemberRole, typeof ROLE_CONFIG[MemberRole]][])
                .filter(([k]) => k !== 'owner')
                .map(([key, cfg]) => (`;
const newRoleMenu = `{(['admin', 'member', 'viewer'] as MemberRole[])
                .map((key) => {
                  const Icon = key === 'admin' ? Shield : key === 'member' ? Users : Eye;
                  const color = key === 'admin' ? 'text-indigo-400' : key === 'member' ? 'text-blue-400' : 'text-slate-400';
                  return (`;
fg = fg.replace(oldRoleMenu, newRoleMenu);
fg = fg.replace("<cfg.icon size={12} />", "<Icon size={12} />");
fg = fg.replace("{cfg.label}", "{t('garage.role_' + key)}");
fg = fg.replace("cfg.color", "color");
fg = fg.replace(")}", ")})}"); // close the map properly

// VehicleShareCard
fg = fg.replace("onToggle: () => void;\n}> = ({ vehicle, logs, isShared, onToggle }) => {", "onToggle: () => void;\n  t: any;\n}> = ({ vehicle, logs, isShared, onToggle, t }) => {");
fg = fg.replace(">Paylaşılıyor</span>", ">{t('garage.shared')}</span>");

// InviteModal
fg = fg.replace("onClose: () => void;\n}> = ({ inviteCode, onInviteByEmail, onClose }) => {", "onClose: () => void;\n  t: any;\n}> = ({ inviteCode, onInviteByEmail, onClose, t }) => {");
fg = fg.replace(">Üye Davet Et</h3>", ">{t('garage.inv_title')}</h3>");
fg = fg.replace(">Davet Kodu</p>", ">{t('garage.inv_code')}</p>");
fg = fg.replace("'Kopyalandı!' : 'Kodu Kopyala'", "t('garage.copied') : t('garage.copy_c')");
fg = fg.replace("'Kopyalandı!' : 'Linki Paylaş'", "t('garage.copied') : t('garage.share_l')");
fg = fg.replace(">veya e-posta ile</span>", ">{t('garage.or_email')}</span>");

fg = fg.replace(`const cfg = ROLE_CONFIG[r];`, `const cfg = {
                  color: r === 'owner' ? 'text-amber-400' : r === 'admin' ? 'text-indigo-400' : r === 'member' ? 'text-blue-400' : 'text-slate-400',
                  bg: r === 'owner' ? 'bg-amber-500/10' : r === 'admin' ? 'bg-indigo-500/10' : r === 'member' ? 'bg-blue-500/10' : 'bg-slate-500/10',
                  border: r === 'owner' ? 'border-amber-500/20' : r === 'admin' ? 'border-indigo-500/20' : r === 'member' ? 'border-blue-500/20' : 'border-slate-500/20',
                  icon: r === 'owner' ? Crown : r === 'admin' ? Shield : r === 'member' ? Users : Eye
                };`);
fg = fg.replace("{cfg.label}", "{t('garage.role_' + r)}");
fg = fg.replace("{cfg.desc}", "{t('garage.role_' + r + '_desc')}");
fg = fg.replace("Davet Gönder", "{t('garage.send_inv')}");

// Create Garage Modal
fg = fg.replace("onClose: () => void;\n}> = ({ onCreate, onClose }) => {", "onClose: () => void;\n  t: any;\n}> = ({ onCreate, onClose, t }) => {");
fg = fg.replace(">Garaj Oluştur</h3>", ">{t('garage.create_title')}</h3>");
fg = fg.replace(">Aile veya ekibinizle araç verilerini paylaşmak için ortak bir garaj oluşturun.</p>", ">{t('garage.create_desc')}</p>");
fg = fg.replace("placeholder=\"örn: Aile Garajı, Şirket Araçları\"", "placeholder={t('garage.create_ph')}");
fg = fg.replace("\n          Garajı Oluştur\n", "\n          {t('garage.create_btn')}\n");

// Join Garage Modal
fg = fg.replace("onClose: () => void;\n}> = ({ onJoin, onClose }) => {", "onClose: () => void;\n  t: any;\n}> = ({ onJoin, onClose, t }) => {");
fg = fg.replace(">Garaja Katıl</h3>", ">{t('garage.join_title')}</h3>");
fg = fg.replace(">Garaj sahibinin sana verdiği 6 haneli kodu gir.</p>", ">{t('garage.join_desc')}</p>");
fg = fg.replace("\n          Garaja Katıl\n", "\n          {t('garage.join_btn')}\n");

// MemberAvatar -> no text needed really, but role config moved inline.
fg = fg.replace("const MemberAvatar: React.FC<{ member: GarageMember; size?: 'sm' | 'md' | 'lg' }> = ({ member, size = 'md' }) => {", "const MemberAvatar: React.FC<{ member: GarageMember; size?: 'sm' | 'md' | 'lg' }> = ({ member, size = 'md' }) => { \n  const RoleCfg = { \n    color: member.role === 'owner' ? 'text-amber-400' : member.role === 'admin' ? 'text-indigo-400' : member.role === 'member' ? 'text-blue-400' : 'text-slate-400', \n    bg: member.role === 'owner' ? 'bg-amber-500/10' : member.role === 'admin' ? 'bg-indigo-500/10' : member.role === 'member' ? 'bg-blue-500/10' : 'bg-slate-500/10', \n    border: member.role === 'owner' ? 'border-amber-500/20' : member.role === 'admin' ? 'border-indigo-500/20' : member.role === 'member' ? 'border-blue-500/20' : 'border-slate-500/20', \n    icon: member.role === 'owner' ? Crown : member.role === 'admin' ? Shield : member.role === 'member' ? Users : Eye \n  };");
fg = fg.replace("const RoleCfg = ROLE_CONFIG[member.role];", "");


// Main Component
fg = fg.replace("export const FamilyGarage: React.FC = () => {\n  const navigate = useNavigate();", "export const FamilyGarage: React.FC = () => {\n  const navigate = useNavigate();\n  const { t } = useTranslation();");
fg = fg.replace("toast.info(`\"${code}\" davet kodu ile katılma isteği gönderildi.`);", "toast.info(t('garage.join_req_sent', { c: code }));");
fg = fg.replace("toast.success(`\"${email}\" adresine davet gönderildi.`);", "toast.success(t('garage.email_inv_sent', { e: email }));");
fg = fg.replace("if (!window.confirm('Garajdan ayrılmak istediğine emin misin?'))", "if (!window.confirm(t('garage.leave_confirm')))");

// UI texts
fg = fg.replace(">Aile Garajı</h1>", ">{t('garage.empty_title')}</h1>");
fg = fg.replace(">Ortak Garaj</h2>", ">{t('garage.empty_subtitle')}</h2>");
fg = fg.replace(">\n            Aile veya ekibinizle araç verilerini paylaşın. Herkes kendi rolüne göre erişebilir.\n          </p>", ">\n            {t('garage.empty_desc')}\n          </p>");
fg = fg.replace("\n              Yeni Garaj Oluştur\n", "\n              {t('garage.btn_new')}\n");
fg = fg.replace("\n              Davete Katıl (Kod ile)\n", "\n              {t('garage.btn_join')}\n");

fg = fg.replace("text: 'Sahip, yönetici, üye, izleyici rol sistemi'", "text: t('garage.feat_1')");
fg = fg.replace("text: 'Araç bazlı paylaşım — ne paylaşacağını sen seç'", "text: t('garage.feat_2')");
fg = fg.replace("text: '6 haneli davet kodu veya e-posta ile davet'", "text: t('garage.feat_3')");

fg = fg.replace("<CreateGarageModal onCreate={handleCreate} onClose={() => setShowCreateModal(false)} />", "<CreateGarageModal onCreate={handleCreate} onClose={() => setShowCreateModal(false)} t={t} />");
fg = fg.replace("<JoinGarageModal onJoin={handleJoin} onClose={() => setShowJoinModal(false)} />", "<JoinGarageModal onJoin={handleJoin} onClose={() => setShowJoinModal(false)} t={t} />");
fg = fg.replace("<InviteModal\n          inviteCode={inviteCode}\n          onInviteByEmail={handleInviteByEmail}\n          onClose={() => setShowInviteModal(false)}\n        />", "<InviteModal\n          inviteCode={inviteCode}\n          onInviteByEmail={handleInviteByEmail}\n          onClose={() => setShowInviteModal(false)}\n          t={t}\n        />");


fg = fg.replace("{garage.members.length} üye · {garage.sharedVehicleIds.length} paylaşılan araç", "{t('garage.counts', { m: garage.members.length, v: garage.sharedVehicleIds.length })}");

fg = fg.replace("label: `Üyeler (${garage.members.length})`", "label: t('garage.tab_m', { c: garage.members.length })");
fg = fg.replace("label: `Araçlar (${garage.sharedVehicleIds.length})`", "label: t('garage.tab_v', { c: garage.sharedVehicleIds.length })");
fg = fg.replace("label: `Davetler (${pendingInvites.length})`", "label: t('garage.tab_i', { c: pendingInvites.length })");

fg = fg.replace("+{garage.members.length - 5} daha", "{t('garage.more_m', { c: garage.members.length - 5 })}");
fg = fg.replace("onRemove={handleRemoveMember}\n                />", "onRemove={handleRemoveMember}\n                  t={t}\n                />");
fg = fg.replace("\n                Yeni Üye Davet Et\n", "\n                {t('garage.btn_inv_new')}\n");
fg = fg.replace("\n              {isOwner ? 'Garajı Kapat' : 'Garajdan Ayrıl'}\n", "\n              {isOwner ? t('garage.btn_close_g') : t('garage.btn_leave')}\n");

fg = fg.replace(">\n                Paylaştığın araçlar garaj üyeleri tarafından görüntülenebilir. Rollere göre kayıt ekleyebilirler.\n              </p>", ">\n                {t('garage.info_v')}\n              </p>");
fg = fg.replace("onToggle={() => handleToggleVehicle(v.id)}\n                />", "onToggle={() => handleToggleVehicle(v.id)}\n                  t={t}\n                />");
fg = fg.replace(">Garajda araç bulunamadı.</p>", ">{t('garage.no_v')}</p>");

const oldInvRoleRender = `const cfg = ROLE_CONFIG[invite.role];`;
const newInvRoleRender = `const cfg = {
                    color: invite.role === 'owner' ? 'text-amber-400' : invite.role === 'admin' ? 'text-indigo-400' : invite.role === 'member' ? 'text-blue-400' : 'text-slate-400',
                    bg: invite.role === 'owner' ? 'bg-amber-500/10' : invite.role === 'admin' ? 'bg-indigo-500/10' : invite.role === 'member' ? 'bg-blue-500/10' : 'bg-slate-500/10',
                    border: invite.role === 'owner' ? 'border-amber-500/20' : invite.role === 'admin' ? 'border-indigo-500/20' : invite.role === 'member' ? 'border-blue-500/20' : 'border-slate-500/20',
                  };`;
fg = fg.replace(oldInvRoleRender, newInvRoleRender);
fg = fg.replace(">{cfg.label}\n                            </span>", ">{t('garage.role_' + invite.role)}\n                            </span>");
fg = fg.replace("{daysLeft > 0 ? `${daysLeft} gün kaldı` : 'Süresi doldu'}", "{daysLeft > 0 ? t('garage.days_left', { d: daysLeft }) : t('garage.expired')}");
fg = fg.replace(">Kod:</span>", ">{t('garage.code_lbl')}</span>");
fg = fg.replace(">Bekleyen davet yok.</p>", ">{t('garage.no_inv')}</p>");
fg = fg.replace("\n                    Davet Gönder\n", "\n                    {t('garage.send_inv')}\n");

fs.writeFileSync('pages/FamilyGarage.tsx', fg);


// --- 3. Update ImportExport.tsx ---
let ix = fs.readFileSync('pages/ImportExport.tsx', 'utf8');

if (!ix.includes('useTranslation')) {
    ix = ix.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useTranslation } from 'react-i18next';"
    );
}

ix = ix.replace(
    "export const TransferHistory: React.FC = () => {\n    const navigate = useNavigate();",
    "export const TransferHistory: React.FC = () => {\n    const navigate = useNavigate();\n    const { t } = useTranslation();"
);

ix = ix.replace(">Yükleniyor...</div>", ">{t('docs.m_saving')}</div>"); // reuse anything similar
ix = ix.replace(">Yükleniyor...</div>", ">{t('importExport.processing')}</div>"); // better
ix = ix.replace("Yükleniyor...", "{t('report.loading')}");

ix = ix.replace(">Araç Bulunamadı</h2>", ">{t('importExport.no_vehicle')}</h2>");
ix = ix.replace(">Transfer edilecek bir aracınız yok.</p>", ">{t('importExport.no_vehicle_desc')}</p>");
ix = ix.replace(">Garaja Dön</button>", ">{t('importExport.return_garage')}</button>");
ix = ix.replace(">Geri</span>", ">{t('importExport.back')}</span>");
ix = ix.replace(">Geçmişi Aktar</h1>", ">{t('importExport.title')}</h1>");
ix = ix.replace("> Aktarıma Hazır\n                     </span>", "> {t('importExport.ready')}\n                     </span>");
ix = ix.replace(">Servis Kayıtları</span>", ">{t('importExport.srv_rec')}</span>");
ix = ix.replace(">Yakıt Verisi</span>", ">{t('importExport.fuel_data')}</span>");
ix = ix.replace(">Belgeler</span>", ">{t('importExport.docs')}</span>");
ix = ix.replace("toast.success('Kod kopyalandı!')", "toast.success(t('importExport.code_copied'))");
ix = ix.replace(">Kodu Kopyala</span>", ">{t('importExport.copy_code')}</span>");
ix = ix.replace(">Paylaş</span>", ">{t('importExport.share')}</span>");
ix = ix.replace(">\n                     Bu QR kodu tek seferlik kullanım içindir. Transfer tamamlandığında, araç sahipliği ve tüm geçmiş veriler alıcıya devredilecektir.\n                 </p>", ">\n                     {t('importExport.info_txt')}\n                 </p>");

ix = ix.replace(
    "export const ScanImport: React.FC = () => {\n    const navigate = useNavigate();",
    "export const ScanImport: React.FC = () => {\n    const navigate = useNavigate();\n    const { t } = useTranslation();"
);

ix = ix.replace("setErrorMsg('Kamera izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.');", "setErrorMsg(t('importExport.err_cam_denied'));");
ix = ix.replace("setErrorMsg('Kamera bulunamadı. Cihazınızda kamera olduğundan emin olun.');", "setErrorMsg(t('importExport.err_cam_notfound'));");
ix = ix.replace("setErrorMsg('Kamera açılamadı: ' + err.message);", "setErrorMsg(t('importExport.err_cam_fail') + err.message);");
ix = ix.replace("toast.warning('Geçersiz kod formatı. Örnek: TR-ABC-123');", "toast.warning(t('importExport.err_invalid'));");
ix = ix.replace("toast.success(`\"${trimmed}\" kodu ile araç geçmişi içe aktarıldı!`);", "toast.success(t('importExport.success_import', { c: trimmed }));");

ix = ix.replace(">QR ile İçe Aktar</h2>", ">{t('importExport.import_qr')}</h2>");
ix = ix.replace(">\n                            Satıcının QR kodunu kamerayla tarayarak araç bakım geçmişini anında al.\n                        </p>", ">\n                            {t('importExport.import_qr_desc')}\n                        </p>");
ix = ix.replace(">Kamerayı Başlat</span>", ">{t('importExport.start_cam')}</span>");
ix = ix.replace(">\n                        Kamera yoksa kodu manuel gir\n                    </button>", ">\n                        {t('importExport.manual_fallback')}\n                    </button>");

ix = ix.replace(">Kamera izni isteniyor...</p>", ">{t('importExport.req_cam')}</p>");

ix = ix.replace(">QR Kodu Tara</h2>", ">{t('importExport.scan_qr')}</h2>");
ix = ix.replace(">Kodu çerçevenin içine getir</p>", ">{t('importExport.scan_hint')}</p>");
ix = ix.replace(">\n                        Manuel kod gir\n                    </button>", ">\n                        {t('importExport.manual_entry')}\n                    </button>");

ix = ix.replace(">Kamera Açılamadı</h3>", ">{t('importExport.cam_failed')}</h3>");
ix = ix.replace(">\n                        Manuel Kod Gir\n                    </button>", ">\n                        {t('importExport.manual_btn')}\n                    </button>");

ix = ix.replace(">Kod Tarandı!</h2>", ">{t('importExport.code_scanned')}</h2>");
ix = ix.replace(">İçe Aktarılıyor...</span>", ">{t('importExport.importing')}</span>");
ix = ix.replace(">Onayla ve İçe Aktar</span>", ">{t('importExport.confirm')}</span>");
ix = ix.replace(">\n                        Tekrar Tara\n                    </button>", ">\n                        {t('importExport.scan_again')}\n                    </button>");

ix = ix.replace(">Manuel Kod Gir</h3>", ">{t('importExport.manual_title')}</h3>");
ix = ix.replace(">Kameraya geç</span>", ">{t('importExport.switch_cam')}</span>");
ix = ix.replace(">Transfer kodunu satıcıdan alın (TR-ABC-123 formatında)</p>", ">{t('importExport.manual_hint')}</p>");
ix = ix.replace(">İşleniyor...</span>", ">{t('importExport.processing')}</span>");

fs.writeFileSync('pages/ImportExport.tsx', ix);

console.log('FamilyGarage and ImportExport translated!');
