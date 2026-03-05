import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
            style={{ background: 'var(--bg, #0a0f1e)' }}>

            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.25)'
                }}>
                <Car size={36} style={{ color: 'var(--accent, #6366f1)' }} />
            </div>

            {/* 404 */}
            <h1 className="text-6xl font-bold mb-2"
                style={{
                    background: 'linear-gradient(135deg, #C9A84C, #E8C96B)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                404
            </h1>

            <h2 className="text-xl font-semibold mb-3"
                style={{ color: 'var(--text, #f8fafc)' }}>
                Sayfa Bulunamadı
            </h2>

            <p className="text-sm mb-8 max-w-sm"
                style={{ color: 'var(--subtext, #94a3b8)' }}>
                Aradığınız sayfa mevcut değil veya taşınmış olabilir. Ana sayfaya dönerek devam edebilirsiniz.
            </p>

            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                style={{
                    background: 'linear-gradient(135deg, #E8C96B, #C9A84C)',
                    color: '#050508',
                    boxShadow: '0 4px 20px rgba(201,168,76,0.3)',
                }}
            >
                <ArrowLeft size={16} />
                Ana Sayfaya Dön
            </button>
        </div>
    );
};
