import React, { useEffect } from 'react';
import { ADS_CONFIG } from '../config/ads.config';

const GoogleAd = ({ slot, format = 'auto', responsive = 'true', className = "" }) => {
    useEffect(() => {
        try {
            // Tentative d'initialisation de Google AdSense
            if (window.adsbygoogle) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }, [slot]);

    return (
        <div className={`ad-container my-8 overflow-hidden rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center p-4 min-h-[100px] ${className}`}>
            {/* Placeholder pour le développement - Sera remplacé par la vraie pub en prod */}
            <div className="flex flex-col items-center gap-2">
                 <ins className="adsbygoogle"
                    style={{ display: 'block', minWidth: '250px' }}
                    data-ad-client={ADS_CONFIG.PUBLISHER_ID}
                    data-ad-slot={slot || ADS_CONFIG.SLOTS.HOME_HERO}
                    data-ad-format={format}
                    data-full-width-responsive={responsive}>
                </ins>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700">Sponsorisé</div>
            </div>
        </div>
    );
};

export default GoogleAd;
