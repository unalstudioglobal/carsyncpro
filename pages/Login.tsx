import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Terminal, Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { createUserDocument } from '../services/firestoreService';
import { checkOnboarding } from './Onboarding';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [loginState, setLoginState] = useState<'idle' | 'authenticating' | 'success' | 'error' | 'reset_sent'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Email/Password State
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Mock loading sequence text for the "HUD" effect
    const loadingSequence = [
        t('login.seq_1'),
        t('login.seq_2'),
        t('login.seq_3'),
        t('login.seq_4')
    ];

    const [sequenceIndex, setSequenceIndex] = useState(0);

    const startLoadingSequence = () => {
        let i = 0;
        const interval = setInterval(() => {
            setSequenceIndex(prev => {
                if (prev < loadingSequence.length - 1) return prev + 1;
                clearInterval(interval);

                // Navigate after sequence finishes
                setTimeout(() => {
                    if (checkOnboarding()) navigate('/onboarding');
                    else navigate('/');
                }, 800);

                return prev;
            });
        }, 600);
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setErrorMessage(t('login.err_fill_all'));
            setLoginState('error');
            return;
        }

        setLoginState('authenticating');
        setErrorMessage('');

        try {
            if (authMode === 'login') {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                await createUserDocument(userCredential.user);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await createUserDocument(userCredential.user);
            }
            setLoginState('success');
            startLoadingSequence();
        } catch (error: any) {
            console.error("Auth Error:", error);
            setLoginState('error');

            switch (error.code) {
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setErrorMessage(t('login.err_inv_cred'));
                    break;
                case 'auth/email-already-in-use':
                    setErrorMessage(t('login.err_in_use'));
                    break;
                case 'auth/weak-password':
                    setErrorMessage(t('login.err_weak'));
                    break;
                case 'auth/invalid-email':
                    setErrorMessage(t('login.err_inv_email'));
                    break;
                default:
                    setErrorMessage(error.message || t('login.err_fail'));
            }
        }
    };

    const handleGoogleLogin = async () => {
        setLoginState('authenticating');
        setErrorMessage('');

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            await createUserDocument(result.user);

            setLoginState('success');
            startLoadingSequence();

        } catch (error: any) {
            console.error("Login Error Full Object:", error);

            const errString = String(error).toLowerCase();
            const errMessage = error.message?.toLowerCase() || '';
            const errCode = error.code || '';

            // Enhanced check for domain/auth errors
            if (
                errCode === 'auth/unauthorized-domain' ||
                errCode === 'auth/operation-not-allowed' ||
                errMessage.includes('unauthorized-domain') ||
                errString.includes('unauthorized-domain') ||
                errString.includes('auth/unauthorized-domain')
            ) {
                console.warn("Unauthorized domain detected.");
                setErrorMessage(t('login.err_unauth_domain'));
                setLoginState('error');
                return;
            }

            setLoginState('error');
            setErrorMessage(error.message || t('login.err_google_fail'));
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setErrorMessage(t('login.err_inv_email'));
            setLoginState('error');
            return;
        }

        setLoginState('authenticating');
        setErrorMessage('');

        try {
            await sendPasswordResetEmail(auth, email);
            setLoginState('reset_sent');
        } catch (error: any) {
            console.error("Reset Error:", error);
            setLoginState('error');
            setErrorMessage(t('login.err_reset'));
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-black pb-safe">

            {/* 1. Cinematic Background with 'Ken Burns' Effect */}
            <div className={`absolute inset-0 z-0 overflow-hidden`}>
                <div className={`w-full h-full relative transition-all duration-[2500ms] ease-in-out ${loginState === 'success' ? 'scale-110 blur-sm' : 'scale-100'}`}>
                    <img
                        src="https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1920&auto=format&fit=crop"
                        alt="Cinematic Car Background"
                        className="w-full h-full object-cover opacity-60 animate-slowPan"
                    />
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40 transition-opacity duration-1000 ${loginState === 'success' ? 'opacity-90' : 'opacity-100'}`}></div>
                </div>
            </div>

            {/* 2. Main Login Content */}
            <div className={`relative z-10 w-full max-w-md px-6 flex flex-col items-center text-center transition-all duration-700 transform ${loginState === 'success' ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0 animate-slideUp'}`}>

                {/* Brand Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl mb-4 rotate-3 border border-white/10 backdrop-blur-xl">
                        <Car size={40} className="text-white drop-shadow-lg" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-1 tracking-tighter">
                        CarSync<span className="text-blue-500">Pro</span>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium tracking-wide">
                        Akıllı Garaj Asistanı
                    </p>
                </div>

                {/* Error Message */}
                {loginState === 'error' && errorMessage && (
                    <div className="mb-6 w-full animate-fadeIn">
                        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex flex-col gap-3 backdrop-blur-md">
                            <div className="flex items-center gap-3 text-red-200 text-xs text-left w-full">
                                <AlertCircle size={18} className="flex-shrink-0 text-red-500" />
                                <span className="font-medium">{errorMessage}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reset Success Message */}
                {loginState === 'reset_sent' && (
                    <div className="mb-6 w-full animate-fadeIn">
                        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex flex-col gap-3 backdrop-blur-md">
                            <div className="flex items-center gap-3 text-green-200 text-xs text-left w-full">
                                <CheckCircle2 size={18} className="flex-shrink-0 text-green-500" />
                                <span className="font-medium">{t('login.reset_link_sent')}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Auth Form */}
                <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl mb-6">
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{t('login.email')}</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-white placeholder-slate-600 outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all text-sm font-medium"
                                    placeholder={t('login.email_ph')}
                                />
                            </div>
                        </div>

                        <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{t('login.password')}</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-10 pr-10 text-white placeholder-slate-600 outline-none focus:border-blue-500/50 focus:bg-black/60 transition-all text-sm font-medium"
                                    placeholder="••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {authMode === 'login' && (
                                <div className="flex justify-end mt-1">
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition"
                                    >
                                        {t('login.forgot_password')}
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loginState === 'authenticating'}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-lg shadow-blue-900/40 relative overflow-hidden"
                        >
                            {loginState === 'authenticating' ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {authMode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                                    <span>{authMode === 'login' ? t('login.login_btn') : t('login.register_btn')}</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-4 flex items-center justify-center space-x-2 text-xs">
                        <span className="text-slate-400">
                            {authMode === 'login' ? t('login.no_account') : t('login.has_account')}
                        </span>
                        <button
                            onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setErrorMessage(''); }}
                            className="text-blue-400 font-bold hover:text-blue-300 transition"
                        >
                            {authMode === 'login' ? t('login.register_btn') : t('login.login_btn')}
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="flex items-center space-x-4 w-full px-6 mb-6 opacity-50">
                    <div className="h-px bg-slate-700 flex-1"></div>
                    <span className="text-xs text-slate-500 font-medium">{t('login.or')}</span>
                    <div className="h-px bg-slate-700 flex-1"></div>
                </div>

                {/* Google Login */}
                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl flex items-center justify-center space-x-3 transition-all hover:bg-slate-100 active:scale-95 mb-6"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    <span className="text-sm">{t('login.google_login')}</span>
                </button>

                <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-600 font-medium tracking-wide uppercase">
                    <ShieldCheck size={12} />
                    <span>{t('login.secure')}</span>
                </div>

            </div>

            {/* 3. HUD Style Transition Overlay - Appears on Success */}
            <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center transition-all duration-500 pointer-events-none ${loginState === 'success' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="w-full max-w-sm px-8 space-y-8 text-center">

                    {/* Animated Check Icon */}
                    <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center ring-2 ring-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.4)] animate-bounce-subtle">
                        <CheckCircle2 size={40} className="text-green-400" />
                    </div>

                    {/* Dynamic Text Sequence */}
                    <div className="h-16 flex items-center justify-center">
                        <h2 className="text-2xl font-bold text-white tracking-tight animate-pulse-slow transition-all duration-300">
                            {loadingSequence[sequenceIndex]}
                        </h2>
                    </div>

                    {/* Futuristic Progress Bar */}
                    <div className="relative w-full h-1.5 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-md">
                        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 w-full animate-progress-loading"></div>
                        {/* Glow effect on bar */}
                        <div className="absolute top-0 left-0 h-full w-full bg-blue-400/30 blur-[4px] animate-progress-loading"></div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes slideUp {
            from { transform: translateY(40px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slowPan {
            0% { transform: scale(1.0) translate(0, 0); }
            50% { transform: scale(1.1) translate(-2%, -2%); }
            100% { transform: scale(1.0) translate(0, 0); }
        }
        @keyframes progressLoading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideUp {
            animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slowPan {
            animation: slowPan 20s ease-in-out infinite alternate;
        }
        .animate-progress-loading {
            animation: progressLoading 1.5s linear infinite;
        }
        .animate-bounce-subtle {
            animation: bounce-subtle 2s ease-in-out infinite;
        }
        .animate-pulse-slow {
             animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
        </div>
    );
};