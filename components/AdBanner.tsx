import React, { useEffect, useRef } from 'react';
import { getSetting } from '../services/settingsService';

interface AdBannerProps {
  slotId: string; // AdSense Slot ID
  format?: 'auto' | 'fluid' | 'rectangle';
  layoutKey?: string; // For In-feed ads
  className?: string;
  label?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slotId,
  format = 'auto',
  layoutKey,
  className = '',
  label = 'Reklam'
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const isPremium = getSetting('isPremium', false);

  useEffect(() => {
    if (!isPremium) {
      const pushAd = () => {
        try {
          // Check if ad is already filled to prevent "All 'ins' elements..." error
          const adElement = adRef.current;
          if (adElement && (adElement.getAttribute('data-ad-status') === 'filled' || adElement.innerHTML.trim().length > 0)) {
            return;
          }

          // Ensure the element has width before pushing to avoid "availableWidth=0" error
          if (adElement && adElement.offsetWidth > 0) {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          } else if (adElement) {
            // If width is still 0, try again in the next frame
            requestAnimationFrame(pushAd);
          }
        } catch (err: any) {
          // Suppress the error if all slots are already filled
          if (err?.message?.includes("All 'ins' elements")) {
            return;
          }
          // Only log if it's not the width error we're trying to avoid
          if (!err?.message?.includes("availableWidth=0")) {
            console.error('AdSense push error:', err);
          }
        }
      };

      // Small delay to ensure layout is settled
      const timer = setTimeout(pushAd, 100);
      return () => clearTimeout(timer);
    }
  }, [isPremium, slotId]);

  // If user is Premium, do not render anything
  if (isPremium) return null;

  return (
    <div className={`w-full flex flex-col items-center justify-center my-6 ${className}`}>
      {/* Ad Label for compliance/UX */}
      <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 opacity-60">
        {label}
      </span>

      {/* Ad Container */}
      <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden flex justify-center items-center min-h-[100px] border border-slate-200 dark:border-slate-800 border-dashed">
        {/* Google AdSense Unit */}
        <ins className="adsbygoogle"
          ref={adRef}
          id={`ad-${slotId}`}
          style={{ display: 'block', width: '100%', textAlign: 'center' }}
          data-ad-client="ca-pub-5162077951759035" // REPLACE WITH YOUR PUBLISHER ID
          data-ad-slot={slotId}
          data-ad-format={format}
          data-ad-layout-key={layoutKey}
          data-full-width-responsive="true">
        </ins>

        {/* Fallback visual for demo purposes (Remove in production if script is active) */}
        <div className="hidden peer-empty:flex text-slate-400 text-xs py-4">
          Google Ads Alanı
        </div>
      </div>
    </div>
  );
};