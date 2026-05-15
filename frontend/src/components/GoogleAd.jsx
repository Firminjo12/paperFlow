import React, { useEffect } from 'react';
import { ADS_CONFIG } from '../config/ads.config';

const GoogleAd = ({ slot, format = 'auto', responsive = 'true', className = "", style = { display: 'block', minWidth: '250px' } }) => {
    useEffect(() => {
        try {
            if (window.adsbygoogle) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }, [slot]);

    return (
        <div className={`ad-container my-8 overflow-hidden rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center p-2 ${className}`}>
            <ins className="adsbygoogle"
                style={style}
                data-ad-client={ADS_CONFIG.PUBLISHER_ID}
                data-ad-slot={slot || ADS_CONFIG.SLOTS.HOME_HERO}
                data-ad-format={format}
                data-full-width-responsive={responsive}>
            </ins>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-700 mt-1">Sponsorisé</div>
        </div>
    );
};

export default GoogleAd;
