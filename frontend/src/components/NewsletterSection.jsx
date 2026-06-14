import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Bell, Sparkles } from 'lucide-react';
import api from '../services/api';

const NewsletterSection = ({ 
    title = "Ne manquez aucune mise à jour.", 
    subtitle = "Rejoignez notre newsletter pour recevoir nos derniers outils et conseils directement dans votre boîte mail.",
    className = ""
}) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(null); // 'loading', 'success', 'error'
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const res = await api.subscribeNewsletter(email);
            setStatus('success');
            setMessage(res.message);
            setEmail('');
        } catch (err) {
            setStatus('error');
            setMessage(err.message);
        }
    };

    return (
        <section className={`max-w-5xl mx-auto px-6 ${className}`}>
            <div className="p-12 md:p-20 bg-slate-900 rounded-[50px] text-center space-y-8 relative overflow-hidden border border-white/5 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
                
                <div className="relative z-10 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                        {title}
                    </h2>
                    <p className="text-slate-400 font-medium max-w-md mx-auto italic">
                        {subtitle}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 space-y-4 max-w-md mx-auto">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="email" 
                                placeholder="votre@email.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white font-bold outline-none focus:border-red-600 transition-colors"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={status === 'loading'}
                            className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all active:scale-95 shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 group"
                        >
                            {status === 'loading' ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    S'inscrire
                                </>
                            )}
                        </button>
                    </div>

                    <AnimatePresence>
                        {status === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center gap-3 text-green-400 text-[10px] font-black uppercase tracking-wider mt-4"
                            >
                                <Bell size={14} className="animate-bounce" />
                                {message || 'Inscription réussie !'}
                            </motion.div>
                        )}
                        {status === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-wider mt-4"
                            >
                                <Sparkles size={14} />
                                {message || 'Une erreur est survenue.'}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </div>
        </section>
    );
};

export default NewsletterSection;
