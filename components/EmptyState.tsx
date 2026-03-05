import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    accentColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    accentColor = '#6366f1'
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fadeIn">
            <div
                className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center relative group"
                style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}20` }}
            >
                {/* Decorative background blobs */}
                <div
                    className="absolute inset-0 rounded-3xl blur-xl opacity-20 -z-10 transition-transform group-hover:scale-125"
                    style={{ background: accentColor }}
                />

                <Icon size={36} color={accentColor} className="animate-float" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2 font-display tracking-wide">
                {title}
            </h3>

            <p className="text-slate-400 text-sm max-w-xs mb-8 leading-relaxed">
                {description}
            </p>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg"
                    style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                        boxShadow: `0 8px 24px -6px ${accentColor}66`,
                        color: '#fff'
                    }}
                >
                    <Plus size={18} />
                    {actionLabel}
                </button>
            )}
        </div>
    );
};
