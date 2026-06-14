import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, Type, Layout, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';

const AdminNewsletter = () => {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState(null); // 'idle', 'loading', 'success', 'error'
    const [message, setMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleConfirmSend = async () => {
        setIsModalOpen(false);
        const token = localStorage.getItem('jwt_token');
        
        setStatus('loading');
        try {
            const res = await api.sendBulkNewsletter(token, {
                subject,
                html: content.replace(/\n/g, '<br>')
            });
            setStatus('success');
            setMessage(res.message);
            setSubject('');
            setContent('');
        } catch (err) {
            setStatus('error');
            setMessage(err.message);
        }
    };

    const handleOpenModal = (e) => {
        e.preventDefault();
        if (!subject || !content) return;
        setIsModalOpen(true);
    };


    return (
        <div className="min-h-screen bg-[#060912] pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <Layout size={14} /> Administration
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase">
                            Envoyer une <br />
                            <span className="text-red-600">Newsletter.</span>
                        </h1>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[80px]" />
                        
                        <form onSubmit={handleOpenModal} className="space-y-8 relative z-10">
                            {/* Sujet */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Type size={14} /> Objet de l'email
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Ex: Nouveautés sur paperFlow ! 🔥"
                                    required
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-600 transition-all"
                                />
                            </div>

                            {/* Contenu */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Mail size={14} /> Contenu du message (HTML autorisé)
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Ecrivez votre message ici..."
                                    required
                                    rows={10}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium outline-none focus:border-red-600 transition-all resize-none"
                                />
                            </div>

                            {/* Feedback */}
                            {status === 'success' && (
                                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm font-bold">
                                    <CheckCircle2 size={20} />
                                    {message}
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold">
                                    <AlertCircle size={20} />
                                    {message}
                                </div>
                            )}

                            {/* Bouton d'envoi */}
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-[0.98] disabled:opacity-50"
                            >
                                {status === 'loading' ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Diffuser à tous les abonnés
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="px-8 flex items-start gap-4 text-slate-500 italic text-sm">
                        <AlertCircle size={20} className="shrink-0 text-red-500/50" />
                        <p>
                            Attention : Cette action est irréversible. L'email sera envoyé individuellement à chaque abonné actif via votre serveur SMTP.
                        </p>
                    </div>
                </motion.div>
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmSend}
                title="Confirmer la diffusion"
                message={`Vous êtes sur le point d'envoyer cet email à TOUS vos abonnés. Voulez-vous continuer ?`}
                confirmText="Confirmer l'envoi"
                cancelText="Annuler"
                type="danger"
            />
        </div>
    );
};


export default AdminNewsletter;
