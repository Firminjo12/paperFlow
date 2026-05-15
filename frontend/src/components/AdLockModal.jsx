import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Download, Lock, Clock, ExternalLink } from 'lucide-react';
import GoogleAd from './GoogleAd';
import { ADS_CONFIG } from '../config/ads.config';

const AdLockModal = ({ isOpen, onClose, onDownload, fileName = "document.pdf" }) => {
    const [timeLeft, setTimeLeft] = useState(10); // 10 secondes de "regardage" de pub
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (isOpen && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setIsReady(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isOpen, timeLeft]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white dark:bg-[#0d1120] rounded-[40px] shadow-2xl border border-white/10 w-full max-w-lg overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-8 pb-4 text-center space-y-2">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            {isReady ? <Download size={32} /> : <Clock size={32} />}
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {isReady ? "Lien de téléchargement prêt !" : "Préparation du lien..."}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {fileName}
                        </p>
                    </div>

                    {/* Pub Area (The "Payment" in attention) */}
                    <div className="px-8 py-4">
                        <div className="bg-slate-50 dark:bg-black/40 rounded-3xl border border-slate-100 dark:border-white/5 p-4 relative overflow-hidden">
                            <GoogleAd 
                                slot={ADS_CONFIG.SLOTS.HOME_HERO} 
                                format="rectangle" 
                                className="my-0 border-none bg-transparent"
                            />
                        </div>
                        {!isReady && (
                            <p className="text-[10px] text-center mt-3 font-black uppercase tracking-widest text-blue-500 animate-pulse">
                                Merci de patienter {timeLeft}s pour déverrouiller...
                            </p>
                        )}
                    </div>

                    {/* Action */}
                    <div className="p-8 pt-4">
                        {isReady ? (
                            <button
                                onClick={() => {
                                    onDownload();
                                    onClose();
                                }}
                                className="w-full h-16 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-green-600/20"
                            >
                                <Download size={20} /> Télécharger Maintenant
                            </button>
                        ) : (
                            <button
                                disabled
                                className="w-full h-16 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 cursor-not-allowed"
                            >
                                <Lock size={18} /> Déverrouillage dans {timeLeft}s
                            </button>
                        )}
                        
                        <button 
                            onClick={onClose}
                            className="w-full mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors uppercase tracking-widest"
                        >
                            Annuler
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AdLockModal;
