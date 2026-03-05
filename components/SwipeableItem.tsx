import React, { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableItemProps {
    children: React.ReactNode;
    onDelete: () => void;
    deleteLabel?: string;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
    children,
    onDelete,
    deleteLabel = 'Sil'
}) => {
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const threshold = 80;

    const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
        setStartX(x - currentX);
        setIsSwiping(true);
    };

    const onTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isSwiping) return;
        const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const diff = Math.min(0, x - startX); // Only allow swiping left
        setCurrentX(diff);
    };

    const onTouchEnd = () => {
        setIsSwiping(false);
        if (currentX < -threshold) {
            setCurrentX(-threshold);
            setIsOpen(true);
        } else {
            setCurrentX(0);
            setIsOpen(false);
        }
    };

    // Close when clicking outside
    useEffect(() => {
        if (isOpen) {
            const handleGlobalClick = (e: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                    setCurrentX(0);
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleGlobalClick);
            return () => document.removeEventListener('mousedown', handleGlobalClick);
        }
    }, [isOpen]);

    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden rounded-2xl mb-3 touch-pan-y"
            style={{ isolation: 'isolate' }}
        >
            {/* Background Action Layer */}
            <div
                className="absolute inset-0 bg-red-500 flex items-center justify-end px-6 transition-opacity"
                style={{ opacity: currentX < -20 ? 1 : 0 }}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                        setCurrentX(0);
                        setIsOpen(false);
                    }}
                    className="flex flex-col items-center gap-1 text-white active:scale-90 transition-transform"
                >
                    <Trash2 size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{deleteLabel}</span>
                </button>
            </div>

            {/* Foreground Content Layer */}
            <div
                style={{
                    transform: `translateX(${currentX}px)`,
                    transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: 'var(--bg-card, #1e293b)'
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onTouchStart}
                onMouseMove={onTouchMove}
                onMouseUp={onTouchEnd}
                onMouseLeave={() => isSwiping && onTouchEnd()}
            >
                {children}
            </div>
        </div>
    );
};
