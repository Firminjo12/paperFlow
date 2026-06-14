import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirmer", 
    cancelText = "Annuler",
    type = "danger" 
}) => {
    const isDanger = type === 'danger';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-[#0d1120] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden"
                    >
                        {/* Decorative Background */}
                        <div className={`absolute -top-24 -right-24 w-48 h-48 ${isDanger ? 'bg-red-600/10' : 'bg-blue-600/10'} rounded-full blur-[60px]`} />
                        
                        <div className="relative z-10 text-center space-y-6">
                            {/* Icon */}
                            <div className={`mx-auto w-16 h-16 ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'} rounded-2xl flex items-center justify-center mb-6`}>
                                <AlertTriangle size={32} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">
                                    {title || "Confirmation"}
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                    {message}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={onConfirm}
                                    className={`w-full ${isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'} text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg active:scale-[0.98]`}
                                >
                                    {confirmText}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full bg-white/5 hover:bg-white/10 text-slate-300 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all border border-white/5 active:scale-[0.98]"
                                >
                                    {cancelText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
