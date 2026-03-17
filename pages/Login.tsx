import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Terminal, Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
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

    // Redirect sonucunu yakalamak için useEffect
    React.useEffect(() => {
        const handleRedirectResult = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    setLoginState('authenticating');
                    await createUserDocument(result.user);
                    setLoginState('success');
                    startLoadingSequence();
                }
            } catch (error: any) {
                console.error("Redirect Auth Error:", error);
                // "auth/auth-domain-config-required" gibi hatalar webview'da sık olur
                if (error.code === 'auth/missing-or-invalid-nonce' || error.message.includes('initial state')) {
                    setErrorMessage(t('login.err_mobile_state'));
                } else {
                    setErrorMessage(error.message || t('login.err_google_fail'));
                }
                setLoginState('error');
            }
        };

        handleRedirectResult();
    }, []);

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

        const isNative = Capacitor.isNativePlatform();

        try {
            const provider = new GoogleAuthProvider();
            
            if (!auth || !provider) {
                throw new Error("Auth or Provider not initialized");
            }

            // Mobil cihazlarda popup genellikle WebView içinde kilitlenir.
            // Redirect yöntemini deniyoruz.
            if (isNative) {
                console.log("Starting Google Redirect Login...");
                await signInWithRedirect(auth, provider);
            } else {
                const result = await signInWithPopup(auth, provider);
                await createUserDocument(result.user);
                setLoginState('success');
                startLoadingSequence();
            }

        } catch (error: any) {
            console.error("Login Error Full Object:", error);
            // ... (hata yakalama logic'i aynı kalıyor)

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
        <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-black pt-safe pb-safe">

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
                        {t('login.subtitle')}
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
                <div className="w-full max-w-sm glass-panel-premium p-8 relative overflow-hidden anim-fade-up" style={{ animationDelay: '0.2s' }}>
                    {/* Background glow for the card */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <form onSubmit={handleEmailAuth} className="space-y-6 relative z-10">
                        <div>
                            <label className="block text-xs font-bold text-indigo-300 uppercase letter-spacing-wider mb-2 ps-1">
                                {t('login.email')}
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-premium pl-11 bg-slate-900/40 border-slate-700/50 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
                                    placeholder={t('login.email_ph')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-indigo-300 uppercase letter-spacing-wider mb-2 ps-1">
                                {t('login.password')}
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-premium pl-11 pr-11 bg-slate-900/40 border-slate-700/50 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
                                    placeholder={t('login.placeholder_password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {authMode === 'login' && (
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-[10px] font-semibold text-indigo-400/80 hover:text-indigo-300 transition-colors uppercase letter-spacing-wider"
                                    >
                                        {t('login.forgot_password')}
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loginState === 'authenticating'}
                            className="btn-premium-3d w-full"
                        >
                            {loginState === 'authenticating' ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{authMode === 'login' ? t('login.btn_login') : t('login.btn_register')}...</span>
                                </div>
                            ) : (
                                <>
                                    {authMode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
                                    <span>{authMode === 'login' ? t('login.btn_login') : t('login.btn_register')}</span>
                                </>
                            )}
                        </button>

                        <div className="flex flex-col items-center gap-4 mt-6">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                <span>{authMode === 'login' ? t('login.no_account') : t('login.has_account')}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthMode(authMode === 'login' ? 'register' : 'login');
                                        setErrorMessage('');
                                    }}
                                    className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-4"
                                >
                                    {authMode === 'login' ? t('login.btn_register') : t('login.btn_login')}
                                </button>
                            </div>
                            
                            <div className="flex items-center w-full gap-3 py-2">
                                <div className="h-[1px] flex-1 bg-white/5"></div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{t('login.or')}</span>
                                <div className="h-[1px] flex-1 bg-white/5"></div>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="w-full max-w-sm anim-fade-up" style={{ animationDelay: '0.4s' }}>
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full glass-chip py-4 px-6 flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95 group relative overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        
                        {/* Google Icon SVG */}
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span className="text-white font-bold text-sm tracking-wide">{t('login.btn_google')}</span>
                    </button>
                </div>
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