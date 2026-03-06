import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { checkAdminAccess } from '../services/adminService';
import { Shield, Lock, Mail, Loader2, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            const isAdmin = await checkAdminAccess(cred.user.uid);

            if (isAdmin) {
                navigate('/dashboard');
            } else {
                await auth.signOut();
                setError('Bu sisteme erişim yetkiniz bulunmamaktadır.');
            }
        } catch (err: any) {
            setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-void)]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-dim rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md animate-fadeUp">
                <div className="glass p-10 rounded-[32px] border-white/5 relative overflow-hidden backdrop-blur-2xl">
                    <div className="relative z-10">
                        <div className="flex justify-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gold-dim border border-gold/20 flex items-center justify-center relative group">
                                <Shield className="text-gold w-8 h-8 group-hover:scale-110 transition-transform" />
                                <Sparkles className="absolute -top-1 -right-1 text-gold w-4 h-4 animate-pulse" />
                            </div>
                        </div>

                        <div className="text-center mb-10">
                            <h1 className="text-2xl font-bold text-white mb-2 font-display uppercase tracking-widest">
                                CarSync <span className="text-gold">Admin</span>
                            </h1>
                            <p className="text-[var(--text-secondary)] text-sm">
                                Sistem yönetim paneline hoş geldiniz.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gold/80 uppercase tracking-wider pl-1">E-Posta</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-[var(--text-muted)] outline-none focus:border-gold/30 focus:bg-white/[0.08] transition-all"
                                        placeholder="admin@carsyncpro.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gold/80 uppercase tracking-wider pl-1 font-body">Şifre</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-5 h-5" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-[var(--text-muted)] outline-none focus:border-gold/30 focus:bg-white/[0.08] transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl animate-shake">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gold hover:bg-gold-light disabled:opacity-50 text-black font-bold py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(201,168,76,0.2)] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Sisteme Giriş Yap'
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-[40px] rounded-full" />
                </div>
            </div>
        </div>
    );
};
